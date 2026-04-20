import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

const Topnav = ({ user }) => {
  const accountName = user?.name || "Kullanıcı";
  const initial = accountName.charAt(0).toUpperCase();

  return (
    <div className="topnav">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Bell size={20} className="text-muted" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
        <Settings size={20} className="text-muted" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
        
        <div className="user-profile">
          <div className="avatar">{initial}</div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{accountName}</span>
        </div>
      </div>
    </div>
  );
};

export default Topnav;
