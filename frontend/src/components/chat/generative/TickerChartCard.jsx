import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Maximize2, Zap, Activity, BarChart2 } from 'lucide-react';

const SAMPLE_TIMEFRAME_DATA = {
  '1D': [
    { time: '09:30', price: 182.4, ma: 181.8 },
    { time: '11:00', price: 184.2, ma: 182.9 },
    { time: '12:30', price: 183.1, ma: 183.4 },
    { time: '14:00', price: 187.9, ma: 185.0 },
    { time: '15:30', price: 189.6, ma: 187.1 },
    { time: '16:00', price: 191.2, ma: 188.8 }
  ],
  '1W': [
    { time: 'Mon', price: 175.0, ma: 174.0 },
    { time: 'Tue', price: 178.5, ma: 176.2 },
    { time: 'Wed', price: 182.0, ma: 179.0 },
    { time: 'Thu', price: 186.4, ma: 182.5 },
    { time: 'Fri', price: 191.2, ma: 185.8 }
  ],
  '1M': [
    { time: 'Week 1', price: 162.0, ma: 160.0 },
    { time: 'Week 2', price: 170.5, ma: 165.5 },
    { time: 'Week 3', price: 178.0, ma: 171.2 },
    { time: 'Week 4', price: 191.2, ma: 179.8 }
  ],
  '1Y': [
    { time: 'Q1', price: 135.0, ma: 130.0 },
    { time: 'Q2', price: 154.0, ma: 142.0 },
    { time: 'Q3', price: 168.0, ma: 156.0 },
    { time: 'Q4', price: 191.2, ma: 172.0 }
  ]
};

const TickerChartCard = ({ data }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [showMA, setShowMA] = useState(true);

  const {
    ticker = 'NVDA',
    name = 'NVIDIA Corporation',
    price = 191.20,
    change = 8.80,
    changePercent = 4.82,
    currency = 'USD',
    sentiment = 'Strong Bullish (88/100)',
    rsi = 68.4,
    volume24h = '$4.2B',
    supportResistance = { support: '$182.50', resistance: '$198.00' },
    chartData = SAMPLE_TIMEFRAME_DATA[timeframe] || SAMPLE_TIMEFRAME_DATA['1D']
  } = data || {};

  const isPositive = change >= 0;
  const currentChart = SAMPLE_TIMEFRAME_DATA[timeframe] || chartData;

  return (
    <div className="gen-ui-card ticker-chart-card">
      {/* Card Header */}
      <div className="gen-card-header">
        <div className="ticker-main-header">
          <div className="ticker-badge-box">
            <span className="ticker-code">{ticker}</span>
            <span className="ticker-full-name">{name}</span>
          </div>
          <div className="ticker-price-block">
            <div className="ticker-price">${price.toFixed(2)} <span className="currency-tag">{currency}</span></div>
            <div className={`ticker-change ${isPositive ? 'trend-up' : 'trend-down'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="timeframe-selector">
          {['1D', '1W', '1M', '1Y'].map((tf) => (
            <button
              key={tf}
              className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Chart */}
      <div className="chart-canvas-container">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={currentChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#4b5563" fontSize={11} tickLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="#4b5563" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0a0e17', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
            {showMA && (
              <Area
                type="monotone"
                dataKey="ma"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Technical Indicators Bar */}
      <div className="technical-indicators-row">
        <div className="tech-indicator">
          <span className="tech-label"><Activity size={12} /> AI Sentiment</span>
          <span className="tech-val positive-glow">{sentiment}</span>
        </div>
        <div className="tech-indicator">
          <span className="tech-label"><Zap size={12} /> RSI (14)</span>
          <span className="tech-val">{rsi} (Neutral-Overbought)</span>
        </div>
        <div className="tech-indicator">
          <span className="tech-label"><BarChart2 size={12} /> 24h Vol</span>
          <span className="tech-val">{volume24h}</span>
        </div>
        <div className="tech-indicator">
          <span className="tech-label">S/R Levels</span>
          <span className="tech-val">{supportResistance.support} / {supportResistance.resistance}</span>
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="gen-card-footer">
        <button 
          className={`indicator-toggle-btn ${showMA ? 'active' : ''}`}
          onClick={() => setShowMA(!showMA)}
        >
          {showMA ? 'Hide EMA (20)' : 'Show EMA (20)'}
        </button>

        <div className="flex-center gap-2">
          <button 
            className="gen-action-btn secondary"
            onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: `Show technical breakout levels for ${ticker}` }))}
          >
            Breakout Targets
          </button>
          <button 
            className="gen-action-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: `Run deep AI quant risk assessment on ${ticker}` }))}
          >
            Deep AI Forecast
          </button>
        </div>
      </div>
    </div>
  );
};

export default TickerChartCard;
