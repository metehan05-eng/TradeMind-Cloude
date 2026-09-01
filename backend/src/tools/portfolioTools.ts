import { UserPortfolio } from '../types/market';

export const getUserPortfolio = async (): Promise<UserPortfolio> => {
  return {
    totalValue: 148520.50,
    dailyPnL: 3410.25,
    dailyPnLPercent: 2.35,
    cashBalance: 24500.00,
    riskScore: 'Moderate / Balanced',
    allocations: [
      { name: 'US Equities (Tech/AI)', value: 52000, percent: 35 },
      { name: 'Crypto (BTC/ETH/SOL)', value: 41500, percent: 28 },
      { name: 'BIST Equities (THYAO/ASELS)', value: 18000, percent: 12 },
      { name: 'Commodities & Gold (XAU)', value: 12520.50, percent: 8.5 },
      { name: 'Cash Reserves (USD/EUR)', value: 24500, percent: 16.5 }
    ],
    holdings: [
      {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        category: 'Equities',
        amount: 126,
        currentPrice: 191.20,
        totalValue: 24091.20,
        dailyPnL: 1102.50,
        dailyPnLPercent: 4.82
      },
      {
        ticker: 'BTC-USD',
        name: 'Bitcoin',
        category: 'Crypto',
        amount: 0.31,
        currentPrice: 92450.00,
        totalValue: 28659.50,
        dailyPnL: 650.20,
        dailyPnLPercent: 2.34
      },
      {
        ticker: 'THYAO.IS',
        name: 'Türk Hava Yolları',
        category: 'Equities',
        amount: 550,
        currentPrice: 312.50,
        totalValue: 171875.00, // TRY
        dailyPnL: 4200.00,
        dailyPnLPercent: 2.50
      },
      {
        ticker: 'AAPL',
        name: 'Apple Inc',
        category: 'Equities',
        amount: 69,
        currentPrice: 228.40,
        totalValue: 15759.60,
        dailyPnL: -126.80,
        dailyPnLPercent: -0.80
      }
    ]
  };
};
