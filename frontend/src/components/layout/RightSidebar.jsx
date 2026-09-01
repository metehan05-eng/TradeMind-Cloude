import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  Globe2, 
  Zap, 
  Activity, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Gauge
} from 'lucide-react';

const MINI_WATCHLIST = [
  { ticker: 'BTC/USD', price: '$92,450.00', change: '+2.34%', up: true },
  { ticker: 'NVDA', price: '$191.20', change: '+4.82%', up: true },
  { ticker: 'ETH/USD', price: '$3,410.50', change: '-1.15%', up: false },
  { ticker: 'TSLA', price: '$248.80', change: '-2.40%', up: false },
  { ticker: 'XAU/USD', price: '$2,912.40', change: '+0.65%', up: true },
  { ticker: 'BRENT OIL', price: '$74.30', change: '-0.92%', up: false }
];

const MACRO_INDICATORS = [
  { name: 'US Fed Funds Rate', val: '4.50%', status: 'Neutral' },
  { name: '10Y US Treasury', val: '4.28%', status: '+3 bps', up: true },
  { name: 'DXY Dollar Index', val: '103.85', status: '-0.14%', up: false },
  { name: 'Global Container Index', val: '$3,240 / FEU', status: '+6.2%', up: true },
  { name: 'Fear & Greed Index', val: '74 (Greed)', status: 'Bullish' }
];

const RightSidebar = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState('markets');

  const handleTickerClick = (ticker) => {
    const cleanTicker = ticker.split('/')[0];
    window.dispatchEvent(new CustomEvent('send-chat-prompt', {
      detail: `Analyze ${cleanTicker} price action and dynamic chart`
    }));
  };

  return (
    <div className={`right-sidebar-panel ${isOpen ? 'open' : 'collapsed'}`}>
      <button 
        className="collapse-toggle-btn" 
        onClick={onToggle}
        title={isOpen ? "Collapse Market Panel" : "Expand Market Panel"}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {isOpen && (
        <div className="right-panel-content">
          {/* Header */}
          <div className="right-panel-header">
            <div className="flex-center gap-2">
              <Activity size={18} className="text-accent-blue" />
              <span className="panel-header-title">Live Market Barometer</span>
            </div>
            <div className="live-indicator-dot">
              <span className="pulsing-circle" /> Live
            </div>
          </div>

          {/* Quick Tabs */}
          <div className="right-tabs">
            <button 
              className={`right-tab ${activeTab === 'markets' ? 'active' : ''}`}
              onClick={() => setActiveTab('markets')}
            >
              Watchlist
            </button>
            <button 
              className={`right-tab ${activeTab === 'macro' ? 'active' : ''}`}
              onClick={() => setActiveTab('macro')}
            >
              Macro & Rates
            </button>
          </div>

          {/* Tab 1: Live Watchlist */}
          {activeTab === 'markets' && (
            <div className="mini-watchlist-list">
              <div className="panel-subtext">Click any asset to generate in-chat AI technical analysis:</div>
              {MINI_WATCHLIST.map((item, idx) => (
                <div 
                  key={idx} 
                  className="mini-watchlist-card"
                  onClick={() => handleTickerClick(item.ticker)}
                >
                  <div className="mini-card-left">
                    <span className="mini-ticker">{item.ticker}</span>
                    <span className="mini-price">{item.price}</span>
                  </div>
                  <div className={`mini-card-right ${item.up ? 'trend-up' : 'trend-down'}`}>
                    {item.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Macro & Economic Barometer */}
          {activeTab === 'macro' && (
            <div className="macro-barometer-list">
              <div className="fear-greed-meter">
                <div className="meter-label">
                  <Gauge size={15} /> Market Sentiment
                </div>
                <div className="meter-val-row">
                  <span className="meter-score text-green">74</span>
                  <span className="meter-mood">Greed (Bullish Risk-On)</span>
                </div>
                <div className="meter-bar-track">
                  <div className="meter-bar-fill" style={{ width: '74%' }} />
                </div>
              </div>

              <div className="panel-subtext" style={{ marginTop: 12 }}>Key Macro Metrics:</div>
              {MACRO_INDICATORS.map((indicator, idx) => (
                <div key={idx} className="macro-stat-row">
                  <span className="macro-name">{indicator.name}</span>
                  <div className="macro-val-block">
                    <span className="macro-val">{indicator.val}</span>
                    <span className={`macro-badge ${indicator.up === false ? 'down' : 'up'}`}>
                      {indicator.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick AI Trigger Box */}
          <div className="right-quick-trigger">
            <span className="trigger-title">AI Market Scanner</span>
            <p className="trigger-desc">Ask TradeMind AI to run a multi-asset correlation or arbitrage scan.</p>
            <button 
              className="trigger-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: 'Run cross-market arbitrage and volatility scanner' }))}
            >
              <Zap size={14} /> Run Global Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
