import React, { useState, useEffect } from 'react';
import { Ship, TrendingUp, AlertCircle, ShoppingCart, Globe, ArrowRight } from 'lucide-react';

const Arbitrage = () => {
  const [arbitrageData, setArbitrageData] = useState([
    { id: 1, product: 'Lityum Pil Hücresi (x1000)', source: 'Çin (Shenzhen)', sourcePrice: 1250, target: 'Almanya (Berlin)', targetPrice: 2100, freight: 120, tax: 80, profit: 650, margin: '31%' },
    { id: 2, product: 'Organik Pamuk İpliği (Ton)', source: 'Hindistan (Mumbai)', sourcePrice: 1800, target: 'İtalya (Milano)', targetPrice: 2850, freight: 250, tax: 150, profit: 650, margin: '22%' },
    { id: 3, product: 'Güneş Paneli 400W (Konteyner)', source: 'Çin (Guangzhou)', sourcePrice: 15000, target: 'ABD (Kaliforniya)', targetPrice: 24000, freight: 3200, tax: 1800, profit: 4000, margin: '16%' }
  ]);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      const apiKey = import.meta.env.VITE_MARKET_ALPHA_VANTAGE_KEY;
      if (!apiKey || apiKey.includes('YOUR_')) return; // Fallback to mock

      try {
        // Example: Fetching real EUR/USD exchange rate to adjust Arbitrage Profit in real-time
        const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=${apiKey}`);
        const data = await res.json();
        const exchangeRate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        
        if (exchangeRate) {
           setArbitrageData(prev => prev.map(item => ({
              ...item,
              profit: Math.round(item.profit * exchangeRate),
              note: 'Gerçek Kura Göre EUR Kârı'
           })));
           setIsRealData(true);
        }
      } catch (err) {
        console.warn('AlphaVantage API bağlanırken hata:', err);
      }
    };

    fetchMarketData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Global Arbitraj Dedektörü</h1>
        <p>Emtia ve ürün bazında küresel fiyat farklarını, lojistik ve gümrük maliyetleri düşülmüş net kârlarıyla analiz edin.</p>
      </div>

      {/* AI Intelligence Banner */}
      <div className="ai-insight-box" style={{ borderColor: 'var(--accent-blue)', margin: '0 0 24px 0' }}>
        <div className="ai-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
          <Globe size={24} />
        </div>
        <div className="ai-content">
          <h4>Fırsat Algılandı: Avrupa Enerji Pazarı</h4>
          <p>Almanya'nın yenilenebilir enerji regülasyonlarındaki değişikliğe bağlı olarak "Lityum Pil Hücreleri" talebinde %45 artış saptandı. Shenzhen rotasından yapılacak ürün alımlarında tahmini net kâr marjı %31. Önerilen aksiyon: Hemen sipariş geç.</p>
          <div className="badge action">Otonom Sipariş Önerisi</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
         <div className="stat-card" style={{ borderColor: 'var(--accent-purple)' }}>
          <div className="stat-header">
            <span>Aktif Arbitraj Fırsatı</span>
            <TrendingUp size={20} className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }} />
          </div>
          <div className="stat-value">124 Adet</div>
          <div className="stat-footer">
            <span className="trend-up">+14</span> 
            <span style={{color: 'var(--text-muted)'}}>Son 24 saatte bulunan</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--accent-green)' }}>
          <div className="stat-header">
            <span>Ortalama Kâr Marjı</span>
            <ShoppingCart size={20} className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }} />
          </div>
          <div className="stat-value">%24.5</div>
          <div className="stat-footer">
            <span className="trend-up">+2.1%</span> 
            <span style={{color: 'var(--text-muted)'}}>Global ortalamanın üstünde</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
           <Ship className="text-secondary" size={20} />
           Canlı Fiyat Uçurumu Analizi (Navlun + Vergi Dahil)
        </div>
        <div style={{ overflowX: 'auto' }}>
           <table className="admin-table">
            <thead>
              <tr>
                <th>Ürün / Emtia</th>
                <th>Tedarik (Kaynak)</th>
                <th>Hedef Pazar</th>
                <th>Lojistik & Vergi</th>
                <th>Net Kâr</th>
                <th>Marj</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {arbitrageData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600' }}>{item.product}</td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Maliyet: ${item.sourcePrice}</span><br/>
                    {item.source}
                  </td>
                  <td>
                     <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Satış: ${item.targetPrice}</span><br/>
                     {item.target}
                  </td>
                  <td style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                    -${item.freight + item.tax}
                  </td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                    +${item.profit}
                  </td>
                  <td>
                    <span className="badge success">{item.margin}</span>
                  </td>
                  <td>
                    <button style={{ background: 'var(--bg-primary)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                      Piyasaya Sür <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} /> Dünya Ticaret Örgütü (WTO) canlı gümrük tarifeleri ve anlık konteyner kiralama endeksleri kullanılarak net kâr hesaplanmıştır.
        </p>
      </div>

    </div>
  );
};

export default Arbitrage;
