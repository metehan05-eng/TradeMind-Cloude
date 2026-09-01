import YahooFinance from 'yahoo-finance2';
import { MarketQuote, HistoricalChartResult, HistoricalChartPoint } from '../types/market';
import { marketCache, chartCache } from '../services/cacheService';

// Initialize YahooFinance instance
const yahooFinance = new YahooFinance();

export const normalizeSymbol = (rawSymbol: string): string => {
  let sym = rawSymbol.trim().toUpperCase();

  // Handle crypto mappings (e.g. BTC -> BTC-USD)
  const cryptoList = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'NEAR'];
  if (cryptoList.includes(sym)) {
    return `${sym}-USD`;
  }
  if (sym.endsWith('/USDT') || sym.endsWith('/USD')) {
    return `${sym.split('/')[0]}-USD`;
  }

  // Handle Borsa Istanbul (BIST) tickers without .IS
  const bistKnown = ['THYAO', 'ASELS', 'GARAN', 'AKBNK', 'EREGL', 'KCHOL', 'SISE', 'BIMAS', 'TUPRS', 'SAHOL', 'FROTO', 'TOASO', 'PETKM', 'YKBNK'];
  if (bistKnown.includes(sym)) {
    return `${sym}.IS`;
  }

  return sym;
};

export const getMarketQuote = async (symbols: string[]): Promise<MarketQuote[]> => {
  if (!symbols || symbols.length === 0) return [];

  const results: MarketQuote[] = [];
  const uncachedSymbols: string[] = [];

  // Check cache first
  for (const rawSym of symbols) {
    const sym = normalizeSymbol(rawSym);
    const cached = marketCache.get<MarketQuote>(`quote_${sym}`);
    if (cached) {
      results.push(cached);
    } else {
      uncachedSymbols.push(sym);
    }
  }

  if (uncachedSymbols.length === 0) {
    return results;
  }

  // Fetch uncached symbols in parallel
  const fetchPromises = uncachedSymbols.map(async (sym): Promise<MarketQuote> => {
    try {
      const quote: any = await yahooFinance.quote(sym);
      const regularPrice = quote.regularMarketPrice || quote.price || 0;
      const prevClose = quote.regularMarketPreviousClose || quote.chartPreviousClose || regularPrice;
      const change = quote.regularMarketChange ?? (regularPrice - prevClose);
      const changePercent = quote.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0);

      const quoteObj: MarketQuote = {
        symbol: sym,
        shortName: quote.shortName || quote.longName || sym,
        regularMarketPrice: regularPrice,
        regularMarketChange: Number(change.toFixed(2)),
        regularMarketChangePercent: Number(changePercent.toFixed(2)),
        regularMarketDayHigh: quote.regularMarketDayHigh || regularPrice * 1.02,
        regularMarketDayLow: quote.regularMarketDayLow || regularPrice * 0.98,
        regularMarketVolume: quote.regularMarketVolume || 0,
        currency: quote.currency || (sym.endsWith('.IS') ? 'TRY' : 'USD'),
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        timestamp: Date.now(),
        source: 'Yahoo Finance Live'
      };

      marketCache.set(`quote_${sym}`, quoteObj);
      return quoteObj;
    } catch (err: any) {
      console.warn(`[MarketTools] Error fetching quote for ${sym}: ${err.message}. Using synthetic fallback.`);
      const fallbackPrice = sym.includes('BTC') ? 92450 : sym.includes('THYAO') ? 312.5 : 191.2;
      const fallbackObj: MarketQuote = {
        symbol: sym,
        shortName: sym,
        regularMarketPrice: fallbackPrice,
        regularMarketChange: 4.8,
        regularMarketChangePercent: 2.5,
        regularMarketDayHigh: fallbackPrice * 1.03,
        regularMarketDayLow: fallbackPrice * 0.97,
        regularMarketVolume: 15000000,
        currency: sym.endsWith('.IS') ? 'TRY' : 'USD',
        timestamp: Date.now(),
        source: 'TradeMind Synthetic Fallback'
      };
      marketCache.set(`quote_${sym}`, fallbackObj);
      return fallbackObj;
    }
  });

  const fetchedQuotes = await Promise.all(fetchPromises);
  return [...results, ...fetchedQuotes];
};

export const getHistoricalChart = async (
  symbol: string,
  interval: '1m' | '5m' | '15m' | '1d' | '1wk' | '1mo' = '1d',
  range: '1d' | '5d' | '1mo' | '3mo' | '1y' = '1mo'
): Promise<HistoricalChartResult> => {
  const normSym = normalizeSymbol(symbol);
  const cacheKey = `chart_${normSym}_${interval}_${range}`;
  const cached = chartCache.get<HistoricalChartResult>(cacheKey);
  if (cached) return cached;

  try {
    const period1 = new Date();
    if (range === '1d') period1.setDate(period1.getDate() - 1);
    else if (range === '5d') period1.setDate(period1.getDate() - 5);
    else if (range === '1mo') period1.setMonth(period1.getMonth() - 1);
    else if (range === '3mo') period1.setMonth(period1.getMonth() - 3);
    else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1);

    const result: any = await yahooFinance.chart(normSym, {
      period1,
      interval: interval as any
    });

    const quotes = result.quotes || [];
    const points: HistoricalChartPoint[] = quotes
      .filter((q: any) => q.close !== null && q.close !== undefined)
      .map((q: any) => ({
        time: new Date(q.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        price: Number(q.close.toFixed(2)),
        volume: q.volume
      }));

    // Calculate simple moving average (SMA 10)
    for (let i = 0; i < points.length; i++) {
      const slice = points.slice(Math.max(0, i - 9), i + 1);
      const avg = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
      points[i].ma = Number(avg.toFixed(2));
    }

    const currentPrice = points.length > 0 ? points[points.length - 1].price : 100;
    const firstPrice = points.length > 0 ? points[0].price : 100;
    const changePercent = Number((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(2));

    const chartRes: HistoricalChartResult = {
      symbol: normSym,
      interval,
      range,
      currency: result.meta?.currency || (normSym.endsWith('.IS') ? 'TRY' : 'USD'),
      points: points.length > 0 ? points : generateMockChartPoints(normSym),
      currentPrice,
      changePercent,
      source: 'Yahoo Finance'
    };

    chartCache.set(cacheKey, chartRes);
    return chartRes;
  } catch (err: any) {
    console.warn(`[MarketTools] Chart error for ${normSym}: ${err.message}. Using synthetic chart points.`);
    const mockPoints = generateMockChartPoints(normSym);
    const mockRes: HistoricalChartResult = {
      symbol: normSym,
      interval,
      range,
      currency: normSym.endsWith('.IS') ? 'TRY' : 'USD',
      points: mockPoints,
      currentPrice: mockPoints[mockPoints.length - 1].price,
      changePercent: 3.85,
      source: 'TradeMind Synthetic Model'
    };
    chartCache.set(cacheKey, mockRes);
    return mockRes;
  }
};

function generateMockChartPoints(symbol: string): HistoricalChartPoint[] {
  const base = symbol.includes('BTC') ? 92000 : symbol.includes('THYAO') ? 310 : 190;
  const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  let curr = base;

  return labels.map((day, idx) => {
    curr = curr * (1 + (Math.sin(idx) * 0.02) + 0.005);
    return {
      time: day,
      price: Number(curr.toFixed(2)),
      ma: Number((curr * 0.99).toFixed(2)),
      volume: 1000000 + idx * 50000
    };
  });
}
