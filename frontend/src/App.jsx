import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Topnav from './components/Topnav';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import Landing from './Landing';
import Auth from './Auth';
import SuperAdmin from './SuperAdmin';
import GreenTrade from './components/GreenTrade';
import Arbitrage from './components/Arbitrage';
import Settings from './components/Settings';
import LegalShield from './components/LegalShield';
import CrisisSimulator from './components/CrisisSimulator';
import Trends from './components/Trends';

function App() {
  const [viewState, setViewState] = useState('landing'); // 'landing', 'auth', 'app'
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);

  if (viewState === 'landing') {
    return <Landing onLogin={() => setViewState('auth')} onSuperAdmin={() => setViewState('super_admin')} />;
  }

  if (viewState === 'auth') {
    return <Auth onLoginSuccess={(user) => {
      setCurrentUser(user);
      setViewState('app');
    }} />;
  }

  if (viewState === 'super_admin') {
    return <SuperAdmin onLogout={() => setViewState('landing')} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="main-content">
        <Topnav user={currentUser} />
        {activeMenu === 'dashboard' && <Dashboard />}
        {/* Placeholder components for other menus */}
        {activeMenu === 'crisis' && <CrisisSimulator />}
        {activeMenu === 'legal' && <LegalShield />}
        {activeMenu === 'finance' && (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Finans & Nakit Akışı</h1>
              <p>Harcama, gelir dengesi ve vergi optimizasyonu.</p>
            </div>
          </div>
        )}
        {activeMenu === 'green' && <GreenTrade />}
        {activeMenu === 'trends' && <Trends />}
        {activeMenu === 'arbitrage' && <Arbitrage />}
        {activeMenu === 'settings' && <Settings />}
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
