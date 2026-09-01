import { ToolDefinition } from '../types/agent';
import { getMarketQuote, getHistoricalChart } from './marketTools';
import { searchMarketNews } from './newsTools';
import { getUserPortfolio } from './portfolioTools';

export const REGISTERED_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'getMarketQuote',
      description: 'Fetches real-time price quotes, 24h change %, high/low, and trading volume for given asset symbols using Yahoo Finance. Supports Crypto (BTC, ETH, SOL), US Stocks (NVDA, AAPL, TSLA), and Borsa Istanbul BIST stocks (THYAO, ASELS, GARAN).',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of stock or crypto ticker symbols, e.g. ["NVDA", "BTC-USD", "THYAO.IS"]'
          }
        },
        required: ['symbols']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getHistoricalChart',
      description: 'Retrieves historical candlestick/area chart price points and simple moving averages for a given symbol to render interactive in-chat financial charts.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock, commodity, or crypto symbol (e.g. "NVDA", "THYAO.IS", "BTC-USD")'
          },
          interval: {
            type: 'string',
            enum: ['1m', '5m', '15m', '1d', '1wk', '1mo'],
            description: 'Candle timeframe interval. Default is "1d".'
          },
          range: {
            type: 'string',
            enum: ['1d', '5d', '1mo', '3mo', '1y'],
            description: 'Chart time range. Default is "1mo".'
          }
        },
        required: ['symbol']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchMarketNews',
      description: 'Searches real-time financial, macroeconomic, and geopolitical news impacting trade routes, energy costs, and asset price volatility.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search keywords, e.g. "Suez shipping crisis container rates", "Federal Reserve interest rate cuts", "Tech semiconductor earnings"'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getUserPortfolio',
      description: 'Retrieves the authenticated user’s current live multi-asset portfolio, asset allocations, cash balance, and top positions.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

export const executeToolCall = async (name: string, args: any): Promise<any> => {
  switch (name) {
    case 'getMarketQuote':
      return await getMarketQuote(args.symbols || []);
    case 'getHistoricalChart':
      return await getHistoricalChart(args.symbol, args.interval || '1d', args.range || '1mo');
    case 'searchMarketNews':
      return await searchMarketNews(args.query || '');
    case 'getUserPortfolio':
      return await getUserPortfolio();
    default:
      throw new Error(`Tool "${name}" is not implemented.`);
  }
};
