import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Search, Building2 } from 'lucide-react';

const SuperAdmin = ({ onLogout }) => {
  const [applications, setApplications] = useState([
    { id: '1', company: 'Nexus Lojistik A.Ş.', vkn: '3829104829', email: 'director@nexuslogistics.com', status: 'pending', date: '2 Saat önce' },
    { id: '2', company: 'Global Çelik Sanayi', vkn: '1192847592', email: 'muhasebe@globalcelik.net', status: 'pending', date: '5 Saat önce' },
    { id: '3', company: 'TechTrend E-Ticaret', vkn: '8492019385', email: 'admin@techtrend.com', status: 'approved', date: '1 Gün önce' },
  ]);

  const handleAction = (id, action) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: action } : app
    ));
  };

  return (
    <div className="dashboard-container" style={{ width: '100vw', background: 'var(--bg-primary)' }}>
      <div className="topnav" style={{ justifyContent: 'space-between', padding: '0 40px', marginLeft: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="#8b5cf6" size={28} />
          <h2 style={{ color: 'white' }}>TradeMind Super Admin Paneli</h2>
        </div>
        <button onClick={onLogout} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
          Çıkış Yap
        </button>
      </div>

      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Kurumsal Başvuru Merkezi</h1>
          <p style={{ color: 'var(--text-muted)' }}>Müşterilerin VKN ve domain adreslerini inceleyerek sisteme erişim yetkisi verin.</p>
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Bekleyen Onaylar</h3>
            <div className="auth-input-group" style={{ width: '300px', margin: 0 }}>
              <Search size={18} className="text-muted" />
              <input type="text" className="auth-input" placeholder="Şirket, VKN ara..." />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Şirket Adı</th>
                <th>Vergi No (VKN)</th>
                <th>E-Posta (Domain Kontrolü)</th>
                <th>Başvuru Zamanı</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="var(--accent-blue)" />
                      {app.company}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{app.vkn}</td>
                  <td>{app.email}</td>
                  <td>{app.date}</td>
                  <td>
                    {app.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-approve" onClick={() => handleAction(app.id, 'approved')}>
                          <CheckCircle size={16} /> Onayla
                        </button>
                        <button className="btn-reject" onClick={() => handleAction(app.id, 'rejected')}>
                          <XCircle size={16} /> Reddet
                        </button>
                      </div>
                    ) : (
                      <span className={`badge ${app.status === 'approved' ? 'success' : 'alert'}`}>
                        {app.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
