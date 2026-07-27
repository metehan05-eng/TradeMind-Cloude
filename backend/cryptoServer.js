const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const nameMap = {
  'BTC-USD': { symbol: 'BTC', name: 'Bitcoin' },
  'ETH-USD': { symbol: 'ETH', name: 'Ethereum' },
  'SOL-USD': { symbol: 'SOL', name: 'Solana' },
  'BNB-USD': { symbol: 'BNB', name: 'BNB' },
  'XRP-USD': { symbol: 'XRP', name: 'Ripple' },
  'ADA-USD': { symbol: 'ADA', name: 'Cardano' },
  'DOGE-USD': { symbol: 'DOGE', name: 'Dogecoin' },
  'DOT-USD': { symbol: 'DOT', name: 'Polkadot' },
  'AVAX-USD': { symbol: 'AVAX', name: 'Avalanche' },
  'LINK-USD': { symbol: 'LINK', name: 'Chainlink' },
  'MATIC-USD': { symbol: 'MATIC', name: 'Polygon' },
  'NEAR-USD': { symbol: 'NEAR', name: 'NEAR Protocol' }
};

const generateMockForSymbol = (symbol, name) => {
  const basePrice = Math.random() * 1000 + 10;
  return {
    symbol: symbol.replace('-USD', ''),
    name,
    price: basePrice,
    change24h: (Math.random() * 10) - 5,
    marketCap: Math.floor(Math.random() * 100) + 1,
    high24h: basePrice * 1.05,
    low24h: basePrice * 0.95,
    volume: Math.floor(Math.random() * 10000000),
    description: `Geçici mock verisidir.`
  };
};

const fetchYahooCryptoData = async (ticker) => {
  const info = nameMap[ticker] || { symbol: ticker.replace('-USD', ''), name: ticker };
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Yahoo Finance HTTP ${res.status}`);
    }
    
    const data = await res.json();
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return generateMockForSymbol(info.symbol, info.name);
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.chartPreviousClose || currentPrice;
    const change24h = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
    const high24h = meta.regularMarketDayHigh || currentPrice * 1.02;
    const low24h = meta.regularMarketDayLow || currentPrice * 0.98;
    const volume = meta.regularMarketVolume || 0;
    
    const rawCloses = result.indicators?.quote[0]?.close || [];
    const prices = rawCloses.filter(p => p !== null && !isNaN(p) && p > 0);

    return {
      symbol: info.symbol,
      ticker,
      name: info.name,
      price: currentPrice,
      change24h: isNaN(change24h) ? 0 : change24h,
      marketCap: (currentPrice * (volume || 1000000)) / 1e7,
      high24h,
      low24h,
      volume,
      prices: prices.length > 0 ? prices : [currentPrice],
      source: 'Yahoo Finance Live'
    };
  } catch (err) {
    console.error(`Error fetching ${ticker} from Yahoo Finance:`, err.message);
    return generateMockForSymbol(info.symbol, info.name);
  }
};

const calculateTechnicalIndicators = (prices) => {
  if (!prices || prices.length < 5) {
    return {
      sma20: 0, sma50: 0, rsi: 50, macd: 0, trend: 'Nötr', signal: 'BEKLE', confidence: 'Orta'
    };
  }
  
  const len = prices.length;
  const sma20 = prices.slice(Math.max(0, len - 20)).reduce((a, b) => a + b, 0) / Math.min(len, 20);
  const sma50 = prices.reduce((a, b) => a + b, 0) / len;
  
  const recentPrices = prices.slice(Math.max(0, len - 14));
  let gains = 0, losses = 0;
  for (let i = 1; i < recentPrices.length; i++) {
    const change = recentPrices[i] - recentPrices[i-1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / 14 || 0.001;
  const avgLoss = losses / 14 || 0.001;
  const rs = avgGain / avgLoss;
  const rsi = Math.min(100, Math.max(0, 100 - (100 / (1 + rs))));
  
  const recent12 = prices.slice(Math.max(0, len - 12));
  const ema12 = recent12.reduce((a, b) => a + b, 0) / recent12.length;
  const macd = ema12 - sma20;
  
  let trend = 'Nötr';
  if (sma20 > sma50 * 1.01) trend = 'Yükseliş';
  else if (sma20 < sma50 * 0.99) trend = 'Düşüş';
  
  let signal_ml = 'BEKLE';
  if (rsi < 35 && trend === 'Yükseliş') signal_ml = 'GÜÇLÜ AL';
  else if (rsi < 45) signal_ml = 'AL';
  else if (rsi > 68) signal_ml = 'SAT';
  
  return {
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    rsi: Math.round(rsi * 10) / 10,
    macd: Math.round(macd * 100) / 100,
    trend,
    signal: signal_ml,
    confidence: Math.abs(rsi - 50) < 15 ? 'Düşük' : Math.abs(rsi - 50) < 35 ? 'Orta' : 'Yüksek'
  };
};

const predictionModel = (data, indicators) => {
  let score = 0;
  let reasons = [];
  
  if (indicators.rsi < 35) {
    score += 35;
    reasons.push('RSI aşırı satım bölgesinde (fırsat)');
  } else if (indicators.rsi > 70) {
    score -= 30;
    reasons.push('RSI aşırı alım bölgesinde (düzeltme riski)');
  }
  
  if (indicators.trend === 'Yükseliş') {
    score += 25;
    reasons.push('Ana trend pozitif yükselişte');
  } else if (indicators.trend === 'Düşüş') {
    score -= 25;
    reasons.push('Trend aşağı yönlü hareket ediyor');
  }
  
  if (data.change24h > 3) {
    score += 20;
    reasons.push('24 saatlik güçlü ivme (+%' + data.change24h.toFixed(1) + ')');
  } else if (data.change24h < -3) {
    score -= 20;
    reasons.push('24 saatlik satış baskısı (%' + data.change24h.toFixed(1) + ')');
  }
  
  if (indicators.macd > 0) {
    score += 10;
    reasons.push('MACD göstergesi pozitif bölgede');
  }
  
  let prediction = 'NÖTR';
  if (score > 30) prediction = 'GÜÇLÜ AL';
  else if (score > 10) prediction = 'AL';
  else if (score < -15) prediction = 'SAT';
  
  return {
    score,
    prediction,
    reasons: reasons.slice(0, 3)
  };
};

app.get('/api/crypto/market', async (req, res) => {
  try {
    const tickers = Object.keys(nameMap);
    const rawList = await Promise.all(tickers.map(t => fetchYahooCryptoData(t)));
    
    const enrichedData = rawList.map(crypto => {
      const indicators = calculateTechnicalIndicators(crypto.prices);
      const prediction = predictionModel(crypto, indicators);
      
      const { prices, ...rest } = crypto;
      return {
        ...rest,
        indicators,
        prediction
      };
    });
    
    enrichedData.sort((a, b) => (b.prediction?.score || 0) - (a.prediction?.score || 0));
    res.json(enrichedData);
  } catch (err) {
    console.error('Yahoo Finance Market error:', err);
    res.status(500).json({ error: 'Failed to fetch Yahoo Finance market data' });
  }
});

app.get('/api/crypto/analyze/:symbol', async (req, res) => {
  try {
    const symbolParam = req.params.symbol.toUpperCase();
    const ticker = symbolParam.includes('-USD') ? symbolParam : `${symbolParam}-USD`;
    
    const crypto = await fetchYahooCryptoData(ticker);
    const indicators = calculateTechnicalIndicators(crypto.prices);
    const prediction = predictionModel(crypto, indicators);
    
    let aiInsight = '';
    try {
      if (process.env.GEMINI_API_KEY) {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `${crypto.name} (${crypto.symbol}) için Yahoo Finance verilerine göre canlı piyasa analizi yap.
          Fiyat: $${crypto.price}, 24s Değişim: ${crypto.change24h.toFixed(2)}%
          RSI: ${indicators.rsi}, Trend: ${indicators.trend}
          AI Tahmini: ${prediction.prediction}
          Kısa, 2 cümlelik profesyonel ticari tavsiye ve teknik analiz yorumu sun.`;
        
        const result = await model.generateContent(prompt);
        aiInsight = result.response.text();
      }
    } catch (aiErr) {
      console.warn('Gemini API error:', aiErr.message);
    }
    
    if (!aiInsight) {
      aiInsight = `${crypto.name} (${crypto.symbol}) Yahoo Finance canlı verilerinde $${crypto.price} seviyesinde işlem görüyor. RSI indikatörü ${indicators.rsi} ile ${indicators.trend.toLowerCase()} trendini doğruluyor. Önerilen strateji: ${prediction.prediction}.`;
    }
    
    const { prices, ...rest } = crypto;
    res.json({
      ...rest,
      indicators,
      prediction,
      aiInsight
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze crypto token' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TradeMind Crypto Yahoo Finance Service running on port ${PORT}`);
});