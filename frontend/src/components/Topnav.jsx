import React from 'react';
import { Search, Bell, Settings, LayoutGrid, SidebarClose, SidebarOpen, Zap, Sparkles } from 'lucide-react';

const Topnav = ({ user, onToggleRightPanel, isRightPanelOpen }) => {
  const accountName = user?.name || "Trader Pro";
  const initial = accountName.charAt(0).toUpperCase();

  return (
    <div className="topnav">
      <div className="topnav-left">
        <div className="system-status-indicator">
          <span className="pulsing-green-dot" />
          <span className="sys-status-text">TradeMind Ultra Engine • Online</span>
        </div>
      </div>

      <div className="topnav-right">
        {/* Market Panel Toggle Button */}
        <button 
          className="topnav-icon-btn" 
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? "Hide Live Market Panel" : "Show Live Market Panel"}
        >
          {isRightPanelOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
          <span className="btn-label">Market Barometer</span>
        </button>

        <button className="topnav-icon-btn" title="Alerts & Triggers">
          <Bell size={18} />
        </button>
        
        <div className="user-profile">
          <div className="avatar">{initial}</div>
          <div className="user-meta">
            <span className="user-name">{accountName}</span>
            <span className="user-tier">Quant VIP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topnav;
