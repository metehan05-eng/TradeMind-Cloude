export interface MarketQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  currency?: string;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  timestamp?: number;
  source: string;
}

export interface HistoricalChartPoint {
  time: string;
  price: number;
  ma?: number;
  volume?: number;
}

export interface HistoricalChartResult {
  symbol: string;
  interval: string;
  range: string;
  currency: string;
  points: HistoricalChartPoint[];
  currentPrice: number;
  changePercent: number;
  source: string;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  rsi: number;
  macd: number;
  trend: 'Yükseliş' | 'Düşüş' | 'Nötr';
  signal: 'GÜÇLÜ AL' | 'AL' | 'BEKLE' | 'SAT' | 'GÜÇLÜ SAT';
  confidence: 'Düşük' | 'Orta' | 'Yüksek';
}

export interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  source?: string;
  publishedDate?: string;
}

export interface PortfolioAsset {
  ticker: string;
  name: string;
  category: 'Equities' | 'Crypto' | 'Commodities' | 'Forex' | 'Cash';
  amount: number;
  currentPrice: number;
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
}

export interface UserPortfolio {
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  cashBalance: number;
  riskScore: string;
  allocations: { name: string; value: number; percent: number }[];
  holdings: PortfolioAsset[];
}
