import React from 'react';
import { Leaf, Navigation, MapPin, Wind, Zap } from 'lucide-react';

const GreenTrade = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Yeşil Ticaret Müşaviri</h1>
        <p>Küresel karbon ayak izi hesaplamaları ve AB Sınırda Karbon Vergisi (CBAM) optimizasyonu.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: 'var(--accent-green)' }}>
          <div className="stat-header">
            <span>Toplam Emisyon</span>
            <Wind size={20} className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }} />
          </div>
          <div className="stat-value">14.2 Ton</div>
          <div className="stat-footer">
            <span className="trend-down">-1.5%</span> 
            <span style={{color: 'var(--text-muted)'}}>Geçen sevkiyata göre</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--accent-blue)' }}>
          <div className="stat-header">
            <span>Karbon Vergisi Maliyeti</span>
            <Zap size={20} className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }} />
          </div>
          <div className="stat-value">€1,250</div>
          <div className="stat-footer">
            <span className="trend-down">-€350</span> 
            <span style={{color: 'var(--text-muted)'}}>Alternatif rotalar sayesinde</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '32px' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-title">
            <Navigation className="text-secondary" size={20} />
            Optimum Rota Simülatörü
          </div>
          
          {/* Mock Map Info */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <MapPin color="#ef4444" />
               <div style={{ fontWeight: 'bold' }}>Şangay Port (CN)</div>
            </div>
            
            <div style={{ height: '2px', flex: 1, borderTop: '2px dashed var(--accent-green)', margin: '0 20px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                 🚂 Tren + Elektrikli Tır (Önerilen)
               </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ fontWeight: 'bold' }}>Rotterdam Port (NL)</div>
               <MapPin color="var(--accent-blue)" />
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid var(--accent-green)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={16} color="var(--accent-green)" /> AI Karar Notu
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Klasik deniz yolu taşımacılığı yerine, İpekyolu Demiryolu (+ Son nokta elektrikli tır) rotasını seçtiğinizde teslimat süresi %40, emisyon hacmi ise %65 azalacaktır. Oluşan ek taşıma maliyetini, Avrupa Birliği CBAM (Karbon) sınır vergisinden düşecek **€1,250** ile telafi ediyorsunuz. Net kâr artışı: +%2.3
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GreenTrade;
