import React, { useState, useEffect } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, Brain, RefreshCw, AlertTriangle, Zap, ChevronRight, X } from 'lucide-react';

const Crypto = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCryptoData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crypto/market');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCryptoData(data);
    } catch (err) {
      const mockData = generateMockData();
      setCryptoData(mockData);
      setError('Demo modunda çalışıyor (API bağlanamadı)');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    const cryptos = [
      { symbol: 'BTC', name: 'Bitcoin', price: 67432, change24h: 2.3 },
      { symbol: 'ETH', name: 'Ethereum', price: 3521, change24h: 1.8 },
      { symbol: 'BNB', name: 'BNB', price: 584, change24h: -0.5 },
      { symbol: 'SOL', name: 'Solana', price: 142, change24h: 5.2 },
      { symbol: 'XRP', name: 'Ripple', price: 0.52, change24h: -1.2 },
      { symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: 3.1 },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.12, change24h: 8.5 },
      { symbol: 'DOT', name: 'Polkadot', price: 7.2, change24h: -2.1 },
      { symbol: 'AVAX', name: 'Avalanche', price: 35, change24h: 4.2 },
      { symbol: 'LINK', name: 'Chainlink', price: 14.5, change24h: 1.5 }
    ];

    return cryptos.map(crypto => {
      const rsi = 30 + Math.random() * 40;
      const trend = rsi < 40 ? 'Yükseliş' : rsi > 60 ? 'Düşüş' : 'Nötr';
      const score = (rsi - 50) * 2 + crypto.change24h * 2;

      let prediction = 'NÖTR';
      if (score > 30) prediction = 'GÜÇLÜ AL';
      else if (score > 10) prediction = 'AL';
      else if (score < -15) prediction = 'SAT';

      return {
        ...crypto,
        marketCap: Math.floor(Math.random() * 100) + 1,
        volume: Math.floor(Math.random() * 1000000000),
        high24h: crypto.price * 1.02,
        low24h: crypto.price * 0.98,
        indicators: {
          rsi: Math.round(rsi * 10) / 10,
          trend,
          signal: prediction === 'AL' || prediction === 'GÜÇLÜ AL' ? 'AL' : 'BEKLE',
          confidence: 'Orta'
        },
        prediction: {
          score: Math.round(score),
          prediction,
          reasons: [
            trend === 'Yükseliş' ? 'Trend yükselişte' : 'Trend nötr',
            rsi < 40 ? 'RSI aşırı satım bölgesinde' : 'RSI nötr bölgede',
            crypto.change24h > 0 ? 'Pozitif 24s momentum' : 'Negatif 24s momentum'
          ]
        }
      };
    });
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (prediction) => {
    switch (prediction) {
      case 'GÜÇLÜ AL': return '#10b981';
      case 'AL': return '#22c55e';
      case 'SAT': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSignalBg = (prediction) => {
    switch (prediction) {
      case 'GÜÇLÜ AL': return 'rgba(16, 185, 129, 0.1)';
      case 'AL': return 'rgba(34, 197, 94, 0.1)';
      case 'SAT': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const topGainers = [...cryptoData].sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const topSignals = cryptoData.filter(c => c.prediction.prediction !== 'NÖTR').slice(0, 3);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Kripto AI Ticaret Merkezi</h1>
        <p>Yapay zeka destekli teknik analiz ile kripto para piyasasını analiz edin.</p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid #eab308',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#eab308'
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="ai-insight-box" style={{ borderColor: '#f59e0b', margin: '0 0 24px 0', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(146, 64, 14, 0.1) 100%)' }}>
        <div className="ai-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
          <Brain size={24} />
        </div>
        <div className="ai-content">
          <h4>AI Piyasa Analizi</h4>
          <p>
            {topSignals.length > 0 ? (
              <>En güçlü alım sinyalleri: <strong>{topSignals.map(s => s.symbol).join(', ')}</strong>.
                Genel piyasa {cryptoData.filter(c => c.change24h > 0).length > cryptoData.length / 2 ? 'pozitif' : 'karışık'} momenuma sahip.</>
            ) : (
            <>Piyasa şuanda nötr. Fırsatları bekleyin.</>
            )
          }
          </p>
          <div className="badge action" style={{ background: '#f59e0b', color: '#000' }}>
            <Zap size={12} /> AI Analiz Aktif
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
          <div className="stat-header">
            <span>Piyasa Değeri</span>
            <Bitcoin size={20} className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }} />
          </div>
          <div className="stat-value">${(cryptoData.reduce((a, b) => a + (b.price * b.volume || 0), 0) / 1e9).toFixed(1)}B</div>
          <div className="stat-footer">
            <span className="trend-up">+{cryptoData.filter(c => c.change24h > 0).length}</span>
            <span style={{ color: 'var(--text-muted)' }}>Pozitif jeton</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#10b981' }}>
          <div className="stat-header">
            <span>AL Sinyali</span>
            <TrendingUp size={20} className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />
          </div>
          <div className="stat-value">{cryptoData.filter(c => c.prediction.prediction === 'AL' || c.prediction.prediction === 'GÜÇLÜ AL').length}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Alım fırsatı bulan jeton</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#ef4444' }}>
          <div className="stat-header">
            <span>SAT Sinyali</span>
            <TrendingDown size={20} className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} />
          </div>
          <div className="stat-value">{cryptoData.filter(c => c.prediction.prediction === 'SAT').length}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Riskli jetonlar</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="panel">
          <div className="panel-title" style={{ color: '#10b981' }}>
            <TrendingUp size={18} /> En Güçlü Yükselişler (24s)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {topGainers.map((crypto, idx) => (
              <div key={crypto.symbol} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                cursor: 'pointer'
              }}
                onClick={() => setSelectedCrypto(crypto)}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{crypto.symbol}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{crypto.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#10b981' }}>+{crypto.change24h.toFixed(2)}%</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>${crypto.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title" style={{ color: '#f59e0b' }}>
            <Brain size={18} /> AI Önerilen Alımlar
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {topSignals.map((crypto) => (
              <div key={crypto.symbol} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: getSignalBg(crypto.prediction.prediction),
                borderRadius: '8px',
                border: `1px solid ${getSignalColor(crypto.prediction.prediction)}33`,
                cursor: 'pointer'
              }}
                onClick={() => setSelectedCrypto(crypto)}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{crypto.symbol}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{crypto.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: getSignalColor(crypto.prediction.prediction),
                    color: '#fff'
                  }}>
                    {crypto.prediction.prediction}
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
            {topSignals.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Şuanda güçlü sinyal yok. Bekleyin.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <Bitcoin size={18} /> Tüm Kripto Paralar
          <button
            onClick={fetchCryptoData}
            disabled={isLoading}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Yenile
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kripto</th>
                <th>Fiyat</th>
                <th>24s Değişim</th>
                <th>RSI</th>
                <th>Trend</th>
                <th>Güven</th>
                <th>AI Sinyal</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((crypto) => (
                <tr key={crypto.symbol}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{crypto.symbol}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{crypto.name}</div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span style={{
                      color: crypto.change24h >= 0 ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {crypto.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      background: crypto.indicators.rsi < 30 ? 'rgba(16, 185, 129, 0.2)' :
                        crypto.indicators.rsi > 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                      color: crypto.indicators.rsi < 30 ? '#10b981' :
                        crypto.indicators.rsi > 70 ? '#ef4444' : 'var(--text-muted)'
                    }}>
                      {crypto.indicators.rsi.toFixed(1)}
                    </div>
                  </td>
                  <td>{crypto.indicators.trend}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {crypto.indicators.confidence}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: getSignalColor(crypto.prediction.prediction),
                      color: '#fff'
                    }}>
                      {crypto.prediction.prediction}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedCrypto(crypto)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--accent-blue)',
                        borderRadius: '4px',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCrypto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
          onClick={() => setSelectedCrypto(null)}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedCrypto.name} ({selectedCrypto.symbol})</h2>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  ${selectedCrypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={() => setSelectedCrypto(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>24s Yüksek</div>
                <div style={{ fontWeight: 'bold' }}>${selectedCrypto.high24h.toLocaleString()}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>24s Düşük</div>
                <div style={{ fontWeight: 'bold' }}>${selectedCrypto.low24h.toLocaleString()}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RSI (14)</div>
                <div style={{ fontWeight: 'bold' }}>{selectedCrypto.indicators.rsi.toFixed(1)}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Trend</div>
                <div style={{ fontWeight: 'bold', color: selectedCrypto.indicators.trend === 'Yükseliş' ? '#10b981' : '#ef4444' }}>
                  {selectedCrypto.indicators.trend}
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: getSignalBg(selectedCrypto.prediction.prediction),
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Brain size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0 }}>AI Tahmin</h3>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: getSignalColor(selectedCrypto.prediction.prediction),
                marginBottom: '12px'
              }}>
                {selectedCrypto.prediction.prediction}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Güven Skoru: {Math.abs(selectedCrypto.prediction.score)}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '12px' }}>Analiz Nedenleri:</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                {selectedCrypto.prediction.reasons.map((reason, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{reason}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
                <AlertTriangle size={18} />
                <strong>Uyarı</strong>
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                Bu analiz yalnızca bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir.
                Kripto para yüksek risk içerir. Yatırım kararları kendi sorumluluğunuzdadır.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Crypto;