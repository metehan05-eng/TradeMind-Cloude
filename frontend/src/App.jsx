import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Topnav from './components/Topnav';
import ChatContainer from './components/chat/ChatContainer';
import RightSidebar from './components/layout/RightSidebar';
import Landing from './Landing';
import Auth from './Auth';
import SuperAdmin from './SuperAdmin';
import Settings from './components/Settings';
import DemoConfirmPage from './components/DemoConfirmPage';
import SsoCallbackPage from './components/SsoCallbackPage';

const resolveInitialView = () => {
  if (window.location.pathname.startsWith('/demo/confirm')) return 'demo_confirm';
  if (window.location.pathname === '/sso/callback') return 'sso_callback';
  return 'landing';
};

function App() {
  const [viewState, setViewState] = useState(resolveInitialView); // 'landing', 'auth', 'app'
  const [activeMenu, setActiveMenu] = useState('chat');
  const [currentUser, setCurrentUser] = useState({ name: 'Trader Pro', role: 'Enterprise' });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  if (viewState === 'landing') {
    return <Landing onLogin={() => setViewState('auth')} onSuperAdmin={() => setViewState('super_admin')} />;
  }

  if (viewState === 'demo_confirm') {
    return <DemoConfirmPage onLoginSuccess={(user) => {
      setCurrentUser(user || { name: 'Demo Yönetici' });
      setViewState('app');
    }} />;
  }

  if (viewState === 'sso_callback') {
    return <SsoCallbackPage onLoginSuccess={(user) => {
      setCurrentUser(user || { name: 'Enterprise User' });
      setViewState('app');
    }} />;
  }

  if (viewState === 'auth') {
    return <Auth onLoginSuccess={(user) => {
      setCurrentUser(user || { name: 'Trader Pro' });
      setViewState('app');
    }} />;
  }

  if (viewState === 'super_admin') {
    return <SuperAdmin onLogout={() => setViewState('landing')} />;
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Navigation */}
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Center & Right Container */}
      <div className="main-content chat-first-layout">
        <Topnav 
          user={currentUser} 
          onToggleRightPanel={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
          isRightPanelOpen={isRightSidebarOpen}
        />

        <div className="workspace-body">
          {/* Central Conversational Timeline (Primary Focus) */}
          {activeMenu === 'chat' && <ChatContainer />}

          {/* Standalone Settings if navigated */}
          {activeMenu === 'settings' && (
            <div className="legacy-settings-wrapper">
              <Settings />
            </div>
          )}

          {/* Right Collapsible Live Market Watchlist & Economic Indicators */}
          <RightSidebar 
            isOpen={isRightSidebarOpen} 
            onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
