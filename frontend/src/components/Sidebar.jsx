import React from 'react';
import { 
  MessageSquare, 
  Wallet, 
  TrendingUp, 
  BookmarkCheck, 
  Package, 
  Ship, 
  Scale, 
  Leaf, 
  Settings as SettingsIcon, 
  Plus, 
  Sparkles,
  Bot,
  Zap,
  Activity
} from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu, onNewChat }) => {
  const quickActions = [
    { id: 'chat', label: 'AI Workspace Chat', icon: <MessageSquare size={18} /> },
    { id: 'portfolio_prompt', label: 'Portfolio Analytics', icon: <Wallet size={18} />, prompt: 'Show my portfolio' },
    { id: 'watchlist_prompt', label: 'Live Watchlist', icon: <BookmarkCheck size={18} />, prompt: 'Show my watchlist' },
    { id: 'chart_prompt', label: 'Technical Charts', icon: <TrendingUp size={18} />, prompt: 'Show me technical chart and indicators for NVDA' },
    { id: 'crisis_prompt', label: 'Crisis Simulator', icon: <Package size={18} />, prompt: 'Simulate supply chain crisis and Suez disruption' },
    { id: 'arbitrage_prompt', label: 'Arbitrage Detector', icon: <Ship size={18} />, prompt: 'Find cross-border arbitrage opportunities' },
    { id: 'legal_prompt', label: 'Legal Shield & WTO', icon: <Scale size={18} />, prompt: 'Review Incoterms and customs compliance requirements' },
    { id: 'green_prompt', label: 'CBAM & Green Trade', icon: <Leaf size={18} />, prompt: 'Analyze EU CBAM carbon taxation on imports' },
  ];

  const handleMenuClick = (item) => {
    setActiveMenu('chat');
    if (item.prompt) {
      window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: item.prompt }));
    }
  };

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-icon">
          <TrendingUp size={22} />
        </div>
        <div>
          <div className="brand-text">TradeMind AI</div>
          <span className="brand-sub">Conversational Trading</span>
        </div>
      </div>

      {/* New Chat Primary Button */}
      <button 
        className="new-chat-btn" 
        onClick={() => {
          setActiveMenu('chat');
          window.location.reload(); // Quick reset
        }}
      >
        <Plus size={16} />
        <span>New AI Session</span>
      </button>

      {/* Navigation Section */}
      <div className="nav-section-title">AI WORKSPACE CAPABILITIES</div>
      <ul className="nav-menu">
        {quickActions.map(item => (
          <li 
            key={item.id} 
            className={`nav-item ${activeMenu === item.id || (activeMenu === 'chat' && item.id === 'chat') ? 'active' : ''}`}
            onClick={() => handleMenuClick(item)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      {/* Model Router Status Box */}
      <div className="sidebar-status-box">
        <div className="status-header">
          <div className="flex-center gap-2">
            <span className="pulsing-green-dot" />
            <span className="status-title">AI Engine Connected</span>
          </div>
          <Sparkles size={14} className="text-accent-blue" />
        </div>
        <p className="status-desc">Autonomous Quant & Multimodal LLM active.</p>
      </div>

      {/* Bottom Settings Link */}
      <div className="sidebar-footer">
        <div 
          className="nav-item settings-item"
          onClick={() => setActiveMenu('settings')}
        >
          <SettingsIcon size={18} />
          <span>System Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
