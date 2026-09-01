import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const PortfolioCard = ({ data }) => {
  const {
    totalValue = 148520.50,
    dailyPnL = 3410.25,
    dailyPnLPercent = 2.35,
    cashBalance = 24500.00,
    riskScore = 'Moderate / Balanced',
    allocations = [
      { name: 'US Equities (Tech/Growth)', value: 52000, percent: 35 },
      { name: 'Crypto (BTC/ETH/SOL)', value: 41500, percent: 28 },
      { name: 'Commodities & Gold', value: 18000, percent: 12 },
      { name: 'Global Bonds / Fixed Inc.', value: 12520.50, percent: 8.5 },
      { name: 'Cash Reserves (USD/EUR)', value: 24500, percent: 16.5 }
    ],
    topHoldings = [
      { ticker: 'NVDA', name: 'Nvidia Corp', amount: '$24,200', pnl: '+5.4%', positive: true },
      { ticker: 'BTC', name: 'Bitcoin', amount: '$28,450', pnl: '+3.1%', positive: true },
      { ticker: 'AAPL', name: 'Apple Inc', amount: '$15,800', pnl: '-0.8%', positive: false },
      { ticker: 'SOL', name: 'Solana', amount: '$8,250', pnl: '+8.2%', positive: true },
    ]
  } = data || {};

  const isPositive = dailyPnL >= 0;

  return (
    <div className="gen-ui-card portfolio-card">
      <div className="gen-card-header">
        <div className="flex-center gap-2">
          <div className="gen-card-icon">
            <Wallet size={18} />
          </div>
          <div>
            <h4 className="gen-card-title">Portfolio Intelligence Overview</h4>
            <span className="gen-card-subtitle">Aggregated Multi-Asset Balances</span>
          </div>
        </div>
        <span className="gen-pill success">
          <ShieldCheck size={13} /> Live Sync
        </span>
      </div>

      <div className="portfolio-summary-row">
        <div>
          <div className="metric-label">Total Net Worth</div>
          <div className="portfolio-total-val">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="portfolio-pnl-pill">
          <span className="metric-label">24h Return</span>
          <div className={`pnl-val ${isPositive ? 'trend-up' : 'trend-down'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {isPositive ? '+' : ''}${Math.abs(dailyPnL).toLocaleString()} ({isPositive ? '+' : ''}{dailyPnLPercent}%)
          </div>
        </div>
      </div>

      {/* Allocation breakdown with Donut Chart */}
      <div className="portfolio-chart-grid">
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {allocations.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
                contentStyle={{ background: '#121826', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="allocation-list">
          <div className="metric-label" style={{ marginBottom: 6 }}>Asset Allocation</div>
          {allocations.map((item, idx) => (
            <div key={idx} className="allocation-row">
              <div className="flex-center gap-2">
                <span className="dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="alloc-name">{item.name}</span>
              </div>
              <span className="alloc-pct">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Holdings Table */}
      <div className="top-holdings-section">
        <div className="metric-label" style={{ marginBottom: 8 }}>Top Position Movers</div>
        <div className="holdings-grid">
          {topHoldings.map((holding, idx) => (
            <div key={idx} className="holding-chip">
              <div className="holding-main">
                <span className="holding-ticker">{holding.ticker}</span>
                <span className="holding-name">{holding.name}</span>
              </div>
              <div className="holding-right">
                <span className="holding-amount">{holding.amount}</span>
                <span className={`holding-pnl ${holding.positive ? 'text-green' : 'text-red'}`}>
                  {holding.pnl}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="gen-card-footer">
        <div className="card-hint">
          <span>Risk Profile: <strong>{riskScore}</strong></span>
        </div>
        <button 
          className="gen-action-btn" 
          onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: 'Analyze rebalancing suggestions for my portfolio' }))}
        >
          <RefreshCw size={14} /> AI Rebalance Analysis
        </button>
      </div>
    </div>
  );
};

export default PortfolioCard;
