import React, { useState } from 'react';
import { ShieldAlert, FileText, Upload, CheckCircle, AlertTriangle, Scale } from 'lucide-react';

const LegalShield = () => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2500);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Otonom Hukuk Kalkanı (Legal Shield)</h1>
        <p>Incoterms 2020 ve WTO kurallarına dayalı yapay zeka destekli sözleşme analizi.</p>
      </div>

      <div className="dashboard-grid">
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', border: '2px dashed var(--glass-border)' }}>
          {!scanning && !scanned ? (
            <>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
                <Upload size={48} color="var(--accent-purple)" />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Uluslararası Ticaret Sözleşmesini Yükle</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>PDF veya DOCX formatındaki uluslararası tedarik, bayilik veya lojistik sözleşmesini buraya sürükleyin.</p>
              <button 
                onClick={simulateScan}
                style={{ background: 'var(--accent-purple)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <FileText size={18} /> Yapay Zeka Taramasını Başlat
              </button>
            </>
          ) : scanning ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div className="scanning-animation" style={{ width: '60px', height: '60px', border: '4px solid var(--accent-purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <h3>TradeMind Hukuk Motoru Çalışıyor...</h3>
              <p style={{ color: 'var(--text-muted)' }}>40 sayfalık Çince/İngilizce Belge, WTO Kurallarına göre inceleniyor.</p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <CheckCircle size={32} color="var(--accent-green)" />
                <div>
                  <h3 style={{ margin: 0 }}>Tarama Tamamlandı: "shenzhen_supply_agreement.pdf"</h3>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>İçerik: 42 Sayfa | Tespit Edilen Risk: Yüksek</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={18}/> Kritik İhlal Tespit Edildi! (Madde 18.2)
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    "Malların okyanus transitindeyken hasar görmesi veya batması durumunda sorumluluğun alıcıya (size) ait olacağı" şeklinde kurnazca bir <strong>FOB</strong> (Free on Board) maddesi eklenmiş.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginTop: '8px', fontWeight: 'bold' }}>
                    Yapay Zeka Çözümü: Maddenin CIF (Cost, Insurance, and Freight) olarak değiştirilmesini talep edin. Revize edilmiş taslak tarafımca hazırlanıp e-postanıza gönderilmiştir.
                  </p>
                </div>
                
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--accent-green)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Scale size={18}/> Uyumlu Alanlar
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ödeme koşulları ve AB standart gereksinimleri (CBAM uyumluluğu) hukuki standartlarımıza uymaktadır.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel-title">
            <ShieldAlert className="text-secondary" size={20} />
            Hukuki Koruma Durumu
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            92<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100 Koruma Skoru</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            TradeMind, bu ay yüklediğiniz 14 uluslararası sözleşmeyi tarayarak işletmenize oluşabilecek olası <strong>$210,000</strong> tutarında gizli yükümlülük zararını önledi.
          </p>

          <h5 style={{ marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Son Taranan Sözleşmeler</h5>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>🇰🇷 Seul Logistics Ag...</span> <span style={{ color: 'var(--accent-green)' }}>Güvenli</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>🇩🇪 Frankfurt Office_lease...</span> <span style={{ color: 'var(--accent-green)' }}>Güvenli</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>🇺🇸 NDA_TechInnovate...</span> <span style={{ color: '#ef4444' }}>Riskli (Madde 4)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LegalShield;
