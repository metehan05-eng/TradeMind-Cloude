import React from 'react';
import { LayoutDashboard, Package, TrendingUp, DollarSign, Scale, Ship, Leaf, Settings as SettingsIcon } from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Yönetim Paneli', icon: <LayoutDashboard /> },
    { id: 'crisis', label: 'Kriz Simülatörü', icon: <Package /> },
    { id: 'finance', label: 'Finans', icon: <DollarSign /> },
    { id: 'trends', label: 'E-Ticaret Trendleri', icon: <TrendingUp /> },
    { id: 'legal', label: 'Hukuk Kalkanı', icon: <Scale /> },
    { id: 'arbitrage', label: 'Arbitraj Dedektörü', icon: <Ship /> },
    { id: 'green', label: 'Yeşil Ticaret', icon: <Leaf /> },
    { id: 'settings', label: 'Ayarlar & Entegre', icon: <SettingsIcon /> },
  ];

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <TrendingUp size={24} />
        </div>
        <div className="brand-text">TradeMind AI</div>
      </div>
      
      <ul className="nav-menu">
        {menuItems.map(item => (
          <li 
            key={item.id} 
            className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
