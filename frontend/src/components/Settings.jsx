import React, { useState } from 'react';
import { Key, FileText, Download, Briefcase, Link, Database, CheckCircle } from 'lucide-react';

const Settings = () => {
  const [tradeSector, setTradeSector] = useState('E-Ticaret');
  const [apiKeys, setApiKeys] = useState({ shopify: '', erp: '' });
  const [saved, setSaved] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleGenerateReport = () => {
    setReportDownloading(true);
    setTimeout(() => {
      setReportDownloading(false);
      alert('Aylık İşlem Raporu (PDF) başarıyla indirildi!');
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Sistem Entegrasyonu & Ayarlar</h1>
        <p>İşletmenizin AI profilini belirleyin, API bağlantılarınızı kurun ve aylık PDF raporlarınızı yönetin.</p>
      </div>

      <div className="dashboard-grid">
        
        {/* Ticaret Profili Seçimi */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-title">
            <Briefcase className="text-secondary" size={20} />
            Yapay Zeka Ticaret Odağı
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Yapay zeka (Arbitraj & Yasal Danışman), size tavsiye verirken seçtiğiniz bu sektörü baz alacaktır.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['E-Ticaret (FBA/Shopify)', 'Ağır Sanayi İhracatı', 'Emtia & Tarım', 'Tekstil B2B'].map((sector) => (
              <button 
                key={sector}
                onClick={() => setTradeSector(sector)}
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: `1px solid ${tradeSector === sector ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                  background: tradeSector === sector ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)',
                  color: tradeSector === sector ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: tradeSector === sector ? 'bold' : 'normal',
                  transition: 'all 0.3s ease'
                }}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Aylık Raporlama */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-title">
            <FileText className="text-secondary" size={20} />
            Otomatik İşlem Raporları
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Geçtiğimiz ayda yapılan tüm otomatik alım-satım işlemleri, yeşil rota kazançları ve engellenen sözleşme riskleri mali tabloya dönüştürüldü.
          </p>
          <button 
            onClick={handleGenerateReport}
            disabled={reportDownloading}
            style={{ 
              background: 'var(--accent-purple)', 
              color: 'white', 
              border: 'none', 
              padding: '16px', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 'bold', 
              cursor: reportDownloading ? 'not-allowed' : 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              opacity: reportDownloading ? 0.7 : 1
            }}
          >
            <Download size={18} />
            {reportDownloading ? 'PDF Hazırlanıyor...' : 'Ekim 2026 PDF Raporunu İndir'}
          </button>
        </div>

      </div>

      {/* API Integrations */}
      <div className="panel">
        <div className="panel-title">
          <Link className="text-secondary" size={20} />
          Canlı Veri Kaynakları & API Hook
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          TradeMind asistanının işletmenize otonom müdahale edebilmesi için mevcut kullandığınız pazar yeri veya ERP yazılımının Public (Gizli) API anahtarını buraya girin. 
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
              <Key size={16} color="var(--accent-blue)" /> Amazon Pazar Yeri API Token (SP-API)
            </label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="amzn1.application-oa2-client..." 
              value={apiKeys.shopify}
              onChange={(e) => setApiKeys({...apiKeys, shopify: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '4px', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
              <Database size={16} color="var(--accent-green)" /> Yerel ERP Entegrasyonu (Uç Nokta / Endpoint)
            </label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="https://api.v1.sirketiniz.com/webhook/trademind" 
              value={apiKeys.erp}
              onChange={(e) => setApiKeys({...apiKeys, erp: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '4px', color: 'white' }}
            />
          </div>

          <button 
            onClick={handleSave}
            style={{ background: saved ? 'var(--accent-green)' : 'var(--text-main)', color: saved ? 'white' : 'var(--bg-primary)', padding: '12px 24px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: 'fit-content', transition: 'background 0.3s ease', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            {saved ? <><CheckCircle size={18} /> Bağlantılar Senkronize Edildi</> : 'Bağlantıları Kaydet & Eşitle'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
