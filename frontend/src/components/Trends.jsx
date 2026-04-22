import React, { useState } from 'react';
import { TrendingUp, ShoppingBag, Users, Zap, Search, ArrowUpRight, BarChart3, Globe } from 'lucide-react';

const Trends = () => {
  const [activeMarket, setActiveMarket] = useState('Amazon');

  const products = [
    { name: 'Ergonomik Ofis Koltuğu', trend: '+145%', volume: 'High', profit: '$45', score: 92 },
    { name: 'Taşınabilir Güç İstasyonu', trend: '+89%', volume: 'Medium', profit: '$120', score: 88 },
    { name: 'Akıllı Bahçe Kitleri', trend: '+210%', volume: 'Low', profit: '$35', score: 95 },
    { name: 'Yoga Matı (Ekolojik)', trend: '+34%', volume: 'Very High', profit: '$12', score: 78 },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>E-Ticaret İstihbarat Merkezi</h1>
        <p>Global pazar yerlerindeki anlık trendler, rakip analizleri ve AI destekli ürün radarı.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="stat-header">
            <span>Viral Yakalama Skoru</span>
            <Zap size={20} color="var(--accent-blue)" />
          </div>
          <div className="stat-value">94/100</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Yapay zeka %94 doğrulukla trendleri önceden saptıyor.</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="stat-header">
            <span>Aktif Rakip Takibi</span>
            <Users size={20} color="var(--accent-green)" />
          </div>
          <div className="stat-value">1,240</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Seçili niş pazarındaki 1.240 farklı satıcı anlık izleniyor.</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="stat-header">
            <span>Tahmini Kâr Artışı</span>
            <BarChart3 size={20} color="var(--accent-purple)" />
          </div>
          <div className="stat-value">+%22</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Trend odaklı envanter yönetimi ile beklenen kâr artışı.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Marketplace Selection */}
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-title">
            <Globe size={20} className="text-secondary" />
            Pazar Yeri Bazlı Trend Radarı
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            {['Amazon', 'eBay', 'Shopify', 'TikTok Shop', 'Walmart'].map(market => (
              <button
                key={market}
                onClick={() => setActiveMarket(market)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${activeMarket === market ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                  background: activeMarket === market ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)',
                  color: activeMarket === market ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                {market}
              </button>
            ))}
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Ürün Grubu</th>
                <th>Trend Artışı</th>
                <th>Aranma Hacmi</th>
                <th>Birim Kâr</th>
                <th>AI Skor</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingBag size={16} color="var(--accent-blue)" />
                      {p.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{p.trend}</td>
                  <td>
                    <span className={`badge ${p.volume === 'High' || p.volume === 'Very High' ? 'success' : 'action'}`}>
                      {p.volume}
                    </span>
                  </td>
                  <td>{p.profit}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} color="var(--accent-blue)" />
                      {p.score}
                    </div>
                  </td>
                  <td>
                    <button style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--glass-border)', 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem'
                    }}>
                      Detay <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insight Box for Trends */}
        <div className="panel">
          <div className="panel-title">
            <Zap size={20} color="var(--accent-blue)" />
            AI Fırsat Algoritması
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '20px', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
            <h4 style={{ color: 'white', marginBottom: '12px' }}>TikTok Etkisi Uyarısı</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Son 48 saatte <strong>"Smart Home Garden"</strong> aramaları TikTok üzerinde %400 artış gösterdi. 
              Amazon ABD deposundaki stoklar hızla eriyor. 
              <br/><br/>
              <strong>Öneri:</strong> Çinli tedarikçiden hava kargosu ile 500 adet acil stok takviyesi yapın. 
              Lojistik maliyeti artsa da satış fiyatını %25 yukarı çekerek net kârı koruyabilirsiniz.
            </p>
            <button style={{ 
              width: '100%', 
              marginTop: '20px', 
              padding: '12px', 
              background: 'var(--accent-blue)', 
              border: 'none', 
              borderRadius: 'var(--radius-sm)', 
              color: 'white', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Tedarikçiyle İletişime Geç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;
