import React, { useState } from 'react';
import { Globe2, Activity, TrendingDown, DollarSign, ExternalLink } from 'lucide-react';

const CrisisSimulator = () => {
  const [activeScenario, setActiveScenario] = useState(null);

  const scenarios = [
    { id: 'red_sea', title: 'Kızıldeniz Kapanması', desc: 'Süveyş Kanalı rotasındaki krizlerin %100 uzaması durumu.' },
    { id: 'us_china_tariff', title: 'ABD - Çin %20 Vergi Harbi', desc: 'Amerika’nın Çin ürünlerine otonom ek damping vergisi ataması.' },
    { id: 'europe_recession', title: 'Avrupa Resesyonu (Tüketim Düşüşü)', desc: 'Almanya ve Fransa’da sipariş alımlarının %15 azalması.' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Kriz ve Stres Simülatörü 🌍</h1>
        <p>İşletmenizin (Tedarik+Gelir) yapısını küresel şok senaryolarına karşı dijital ikiz üzerinden test edin.</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        
        {/* Scenario Selectors */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel-title">
            <Activity className="text-secondary" size={20} />
            Makro Senaryolar
          </div>
          {scenarios.map(scen => (
            <div 
              key={scen.id} 
              onClick={() => setActiveScenario(scen.id)}
              style={{
                background: activeScenario === scen.id ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                border: activeScenario === scen.id ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <h4 style={{ marginBottom: '4px', color: activeScenario === scen.id ? 'var(--accent-blue)' : 'white' }}>{scen.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{scen.desc}</p>
            </div>
          ))}
          <button style={{ marginTop: 'auto', background: 'var(--bg-secondary)', border: '1px dashed var(--accent-purple)', padding: '12px', borderRadius: '4px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
            + Özel Senaryo Üret
          </button>
        </div>

        {/* Simulation Output Area */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          {activeScenario ? (
            <div style={{ animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <h2>Simülasyon Sonucu</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '50px' }}>
                  <TrendingDown size={18} /> Şirkete Şok Etkisi Yüksek
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Mali Hasar Tahmini</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f87171' }}>-$124,000</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Satış kayıpları ve depolama cezaları nedeniyle önümüzdeki çeyrek tahmini zararınız.
                  </p>
                </div>
                
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
                  <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}>TradeMind AI B-Planı</h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Süveyş tıkanıklığı 2 hafta içinde kritik stok seviyenizi (%12) aşağı çekecektir. Güney Afrika (Cape of Good Hope) rotası yerine, mevcut ürün stoğunu <strong>Hindistan depolarından hava kargosu (Subvansiyonlu)</strong> aracılığı ile aktararak zararı <strong>-$18,000</strong> seviyesine çekebiliriz.
                  </p>
                  <button style={{ marginTop: '16px', background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <ExternalLink size={16} /> Otonom Tedarik Rotalamasını Başlat
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Globe2 size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3>Şok Senaryosu Çalıştırılmadı</h3>
              <p>Olası küresel riskleri hesaplatmak için soldan bir kriz senaryosu seçin.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CrisisSimulator;
