const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';

const generateMockForSymbol = (symbol, name) => {
  const basePrice = Math.random() * 1000 + 10;
  return {
    symbol,
    name,
    price: basePrice,
    change24h: (Math.random() * 10) - 5,
    marketCap: Math.floor(Math.random() * 100) + 1,
    high24h: basePrice * 1.05,
    low24h: basePrice * 0.95,
    volume: Math.floor(Math.random() * 10000000),
    description: `Alpha Vantage API limit. Geçici mock verisidir.`
  };
};

const fetchCryptoData = async (symbol) => {
  const nameMap = {
    'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'BNB': 'BNB', 'XRP': 'Ripple',
    'ADA': 'Cardano', 'DOGE': 'Dogecoin', 'SOL': 'Solana', 'DOT': 'Polkadot',
    'MATIC': 'Polygon', 'AVAX': 'Avalanche', 'LINK': 'Chainlink', 'ATOM': 'Cosmos',
    'UNI': 'Uniswap', 'LTC': 'Litecoin', 'NEAR': 'NEAR Protocol'
  };
  
  const cryptoName = nameMap[symbol] || symbol;
  
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    const url = `${ALPHA_VANTAGE_API}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    // Alpha Vantage limitine (dakikada 5 istek falan) takılırsa yakala
    if (data.Information || data.Note || !data['Time Series (Digital Currency Daily)']) {
      console.warn(`Alpha Vantage API limiti/hatası (${symbol}):`, data.Information || data.Note || 'Bilinmeyen Hata');
      return generateMockForSymbol(symbol, cryptoName);
    }
    
    const timeSeries = data['Time Series (Digital Currency Daily)'];
    const dates = Object.keys(timeSeries);
    
    if (dates.length < 2) return generateMockForSymbol(symbol, cryptoName);
    
    const latestDate = dates[0];
    const previousDate = dates[1];
    
    const currentPrice = parseFloat(timeSeries[latestDate]['4a. close (USD)']);
    const previousClose = parseFloat(timeSeries[previousDate]['4a. close (USD)']);
    const high24h = parseFloat(timeSeries[latestDate]['2a. high (USD)']);
    const low24h = parseFloat(timeSeries[latestDate]['3a. low (USD)']);
    const volume = parseFloat(timeSeries[latestDate]['5. volume']);
    
    const change24h = ((currentPrice - previousClose) / previousClose) * 100;
    
    return {
      symbol,
      name: cryptoName,
      price: currentPrice,
      change24h: isNaN(change24h) ? 0 : change24h,
      marketCap: 0, // Günlük verilere dahil gelmiyor
      high24h: high24h || currentPrice * 1.02,
      low24h: low24h || currentPrice * 0.98,
      volume: volume || 0,
      description: `${cryptoName} Alpha Vantage üzerinden çekilen günlük veriler.`
    };
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err.message);
    return generateMockForSymbol(symbol, cryptoName);
  }
};

const calculateTechnicalIndicators = (prices) => {
  if (prices.length < 20) return null;
  
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.length >= 50 
    ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 
    : sma20;
  
  const recentPrices = prices.slice(-14);
  let gains = 0, losses = 0;
  for (let i = 1; i < recentPrices.length; i++) {
    const change = recentPrices[i] - recentPrices[i-1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  const recent = prices.slice(-12);
  const ema12 = recent.reduce((a, b) => a + b, 0) / 12;
  
  const signal = prices.slice(-26, -12).reduce((a, b) => a + b, 0) / 12;
  const macd = ema12 - signal;
  
  let trend = 'Nötr';
  if (sma20 > sma50 * 1.02) trend = 'Yükseliş';
  else if (sma20 < sma50 * 0.98) trend = 'Düşüş';
  
  let signal_ml = 'BEKLE';
  if (rsi < 30 && trend === 'Yükseliş') signal_ml = 'AL';
  else if (rsi > 70 && trend === 'Düşüş') signal_ml = 'SAT';
  else if (rsi > 30 && rsi < 50 && trend === 'Yükseliş') signal_ml = 'AL';
  
  return {
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    rsi: Math.round(rsi * 100) / 100,
    macd: Math.round(macd * 100) / 100,
    trend,
    signal: signal_ml,
    confidence: Math.abs(rsi - 50) < 20 ? 'Düşük' : Math.abs(rsi - 50) < 40 ? 'Orta' : 'Yüksek'
  };
};

const predictionModel = (data, indicators) => {
  let score = 0;
  let reasons = [];
  
  if (indicators.rsi < 30) {
    score += 30;
    reasons.push('RSI aşırı satım bölgesinde');
  } else if (indicators.rsi > 70) {
    score -= 20;
    reasons.push('RSI aşırı alım bölgesinde');
  }
  
  if (indicators.trend === 'Yükseliş') {
    score += 25;
    reasons.push('Trend yükselişte');
  } else if (indicators.trend === 'Düşüş') {
    score -= 25;
    reasons.push('Trend düşüşte');
  }
  
  if (data.change24h > 5) {
    score += 15;
    reasons.push('Son 24s güçlü yükseliş');
  } else if (data.change24h < -5) {
    score -= 15;
    reasons.push('Son 24s güçlü düşüş');
  }
  
  if (indicators.macd > 0) {
    score += 10;
    reasons.push('MACD pozitif');
  }
  
  if (data.marketCap < 50) {
    score += 10;
    reasons.push('Düşük piyasa değeri - yüksek potansiyel');
  }
  
  let prediction = 'Nötr';
  if (score > 30) prediction = 'GÜÇLÜ AL';
  else if (score > 15) prediction = 'AL';
  else if (score < -15) prediction = 'SAT';
  
  return {
    score,
    prediction,
    reasons: reasons.slice(0, 4)
  };
};

app.get('/api/crypto/market', async (req, res) => {
  try {
    const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC', 'AVAX', 'LINK', 'ATOM', 'UNI', 'LTC', 'NEAR'];
    
    const cryptoData = await Promise.all(
      symbols.map(s => fetchCryptoData(s))
    );
    
    const validData = cryptoData.filter(d => d !== null);
    
    const enrichedData = validData.map(crypto => {
      const prices = Array(50).fill(crypto.price).map((p, i) => p * (1 + (Math.random() - 0.5) * 0.1 * (i/50)));
      const indicators = calculateTechnicalIndicators(prices);
      
      if (!indicators) {
        return { ...crypto, indicators: null, prediction: null };
      }
      
      const prediction = predictionModel(crypto, indicators);
      
      return {
        ...crypto,
        indicators,
        prediction
      };
    });
    
    enrichedData.sort((a, b) => {
      const scoreA = a.prediction?.score || 0;
      const scoreB = b.prediction?.score || 0;
      return scoreB - scoreA;
    });
    
    res.json(enrichedData);
  } catch (err) {
    console.error('Market error:', err);
    res.status(500).json({ error: 'Failed to fetch crypto market data' });
  }
});

app.get('/api/crypto/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const crypto = await fetchCryptoData(symbol);
    
    if (!crypto) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }
    
    const prices = Array(50).fill(crypto.price).map((p, i) => p * (1 + (Math.random() - 0.5) * 0.1 * (i/50)));
    const indicators = calculateTechnicalIndicators(prices);
    const prediction = predictionModel(crypto, indicators);
    
    let aiInsight = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `${crypto.name} (${symbol}) için kısa bir teknik analiz yorumu yap. 
        Fiyat: $${crypto.price}, 24s Değişim: ${crypto.change24h}%
        RSI: ${indicators.rsi}, Trend: ${indicators.trend}
        Önerilen işlem: ${prediction.prediction}
        Kısaca ve profesyonel yaz.`;
      
      const result = await model.generateContent(prompt);
      aiInsight = result.response.text();
    } catch (aiErr) {
      console.warn('Gemini API error:', aiErr.message);
      aiInsight = `${crypto.name} için teknik göstergeler ${indicators.trend} trendini işaret ediyor. RSI ${indicators.rsi} seviyesinde. ${prediction.prediction} sinyali mevcut.`;
    }
    
    res.json({
      ...crypto,
      indicators,
      prediction,
      aiInsight
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze cryptocurrency' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Crypto API running on port ${PORT}`);
});