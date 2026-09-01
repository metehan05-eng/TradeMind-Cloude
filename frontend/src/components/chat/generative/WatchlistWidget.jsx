import React, { useState } from 'react';
import { BookmarkCheck, Search, ArrowUpRight, ArrowDownRight, MessageSquare, Filter } from 'lucide-react';

const DEFAULT_WATCHLIST = [
  { ticker: 'NVDA', name: 'Nvidia Corp', category: 'Equities', price: 191.20, change: 4.82, volume: '$4.2B', signal: 'Strong Buy' },
  { ticker: 'BTC/USDT', name: 'Bitcoin', category: 'Crypto', price: 92450.00, change: 2.34, volume: '$28.1B', signal: 'Accumulate' },
  { ticker: 'ETH/USDT', name: 'Ethereum', category: 'Crypto', price: 3410.50, change: -1.15, volume: '$12.4B', signal: 'Hold' },
  { ticker: 'TSLA', name: 'Tesla Inc', category: 'Equities', price: 248.80, change: -2.40, volume: '$2.8B', signal: 'Watch' },
  { ticker: 'XAU/USD', name: 'Spot Gold', category: 'Commodities', price: 2912.40, change: 0.65, volume: '$9.5B', signal: 'Hedge Buy' },
  { ticker: 'BRENT', name: 'Crude Oil', category: 'Commodities', price: 74.30, change: -0.92, volume: '$3.1B', signal: 'Neutral' },
  { ticker: 'EUR/USD', name: 'Euro / US Dollar', category: 'Forex', price: 1.0842, change: 0.18, volume: '$45.0B', signal: 'Range' }
];

const WatchlistWidget = ({ data }) => {
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const assets = data?.assets || DEFAULT_WATCHLIST;

  const categories = ['All', 'Equities', 'Crypto', 'Commodities', 'Forex'];

  const filteredAssets = assets.filter(item => {
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesSearch = item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAskAI = (ticker) => {
    window.dispatchEvent(new CustomEvent('send-chat-prompt', { 
      detail: `Give me a deep technical and macro market outlook on ${ticker}` 
    }));
  };

  return (
    <div className="gen-ui-card watchlist-gen-card">
      <div className="gen-card-header">
        <div className="flex-center gap-2">
          <div className="gen-card-icon">
            <BookmarkCheck size={18} />
          </div>
          <div>
            <h4 className="gen-card-title">Live Dynamic Watchlist</h4>
            <span className="gen-card-subtitle">{filteredAssets.length} Monitored Global Instruments</span>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="watchlist-categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-chip ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Search */}
      <div className="watchlist-search-row">
        <div className="search-input-box">
          <Search size={14} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search ticker or asset name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="watchlist-table-wrapper">
        <table className="gen-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>24h %</th>
              <th>AI Signal</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset, idx) => {
              const isPositive = asset.change >= 0;
              return (
                <tr key={idx} className="gen-table-row">
                  <td>
                    <div className="asset-cell">
                      <span className="asset-ticker">{asset.ticker}</span>
                      <span className="asset-subname">{asset.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{asset.category}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${typeof asset.price === 'number' ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : asset.price}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`pnl-inline-pill ${isPositive ? 'trend-up' : 'trend-down'}`}>
                      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {isPositive ? '+' : ''}{asset.change}%
                    </span>
                  </td>
                  <td>
                    <span className={`signal-tag ${asset.signal.toLowerCase().includes('buy') ? 'signal-buy' : 'signal-neutral'}`}>
                      {asset.signal}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="table-action-btn"
                      title={`Ask TradeMind AI about ${asset.ticker}`}
                      onClick={() => handleAskAI(asset.ticker)}
                    >
                      <MessageSquare size={13} />
                      <span>Ask AI</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="gen-card-footer">
        <span className="card-hint">Prices updated in real-time via institutional WebSocket feeds</span>
        <button 
          className="gen-action-btn secondary"
          onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: 'Run cross-asset correlation check on my watchlist' }))}
        >
          Correlation Matrix
        </button>
      </div>
    </div>
  );
};

export default WatchlistWidget;
