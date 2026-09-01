import { MarketQuote, HistoricalChartPoint, UserPortfolio } from './market';

export type GenerativeWidgetType = 
  | 'portfolio'
  | 'ticker_chart'
  | 'watchlist'
  | 'crisis_scenarios'
  | 'arbitrage';

export interface PortfolioCardPayload {
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  cashBalance: number;
  riskScore: string;
  allocations?: { name: string; value: number; percent: number }[];
  topHoldings?: { ticker: string; name: string; amount: string; pnl: string; positive: boolean }[];
}

export interface TickerChartCardPayload {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  sentiment?: string;
  rsi?: number;
  volume24h?: string;
  supportResistance?: { support: string; resistance: string };
  chartData?: HistoricalChartPoint[];
}

export interface WatchlistWidgetPayload {
  assets?: {
    ticker: string;
    name: string;
    category: string;
    price: number;
    change: number;
    volume: string;
    signal: string;
  }[];
}

export interface CrisisScenario {
  type: 'optimistic' | 'moderate' | 'severe';
  title: string;
  financialImpact: string;
  financialImpactNumeric?: number;
  riskLevel: string;
  description: string;
  planB: string;
  actionButtonText: string;
}

export interface CrisisScenarioPayload {
  scenarioTitle: string;
  scenarios: CrisisScenario[];
}

export interface ArbitrageCardPayload {
  productName: string;
  sourceMarket: { name: string; buyPrice: string };
  targetMarket: { name: string; sellPrice: string };
  grossMargin: string;
  logisticsCost: string;
  tariffsAndCustoms: string;
  netArbitrageProfit: string;
  estimatedTransitDays: string;
}

export type GenerativeWidgetData = 
  | PortfolioCardPayload
  | TickerChartCardPayload
  | WatchlistWidgetPayload
  | CrisisScenarioPayload
  | ArbitrageCardPayload;

export interface GenerativeUIContract {
  type: GenerativeWidgetType;
  data: GenerativeWidgetData;
}
