import React from 'react';
import { ArrowRight, Globe, TrendingUp, ShieldCheck, Zap, Database, Key } from 'lucide-react';

const Landing = ({ onLogin, onSuperAdmin }) => {
  return (
    <div className="landing-container" style={{ width: '100vw', background: 'var(--bg-primary)', overflowY: 'auto', minHeight: '100vh', color: 'white' }}>
      {/* Navbar */}
      <nav className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 48px', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon neon-border-blue"><TrendingUp size={24} /></div>
          <span className="brand-text neon-text-blue" style={{ fontSize: '1.5rem', fontWeight: 800 }}>TradeMind AI</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}>Özellikler</a>
          <a href="#integration" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}>Entegrasyon</a>
          <a href="#pricing" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}>Fiyatlandırma</a>
          <button onClick={onLogin} className="neon-border-blue" style={{ background: 'var(--accent-blue)', color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
            Panele Giriş <ArrowRight size={18} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ padding: '100px 48px', textAlign: 'center', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.2, background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Küresel Ticaretin Yeni Yapay Zeka Beyni
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Dünya çapındaki arbitraj fırsatlarını keşfedin, tedarik zincirinizi otonom yönetin ve yapay zeka kararlarıyla kârlılığınızı roketleyin. B2B ve E-ticaret için tasarlandı.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
          <button onClick={onLogin} className="neon-border-purple" style={{ background: 'white', color: 'black', padding: '14px 32px', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
            Hemen Başlayın
          </button>
          <button className="glass-panel" style={{ color: 'white', padding: '14px 32px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
            Demoyu İncele
          </button>
        </div>
      </header>

      {/* Integration Section */}
      <section id="integration" style={{ padding: '80px 48px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>İşletmenizi Saniyeler İçinde Bağlayın</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>
          Karmaşık kodlamalara ve aylarca süren IT entegrasyonlarına son. TradeMind AI, modern OAuth ve Webhook mimarileriyle sisteminize hemen adapte olur.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', width: '300px', textAlign: 'left', transition: 'all 0.3s' }}>
            <Globe size={32} className="neon-text-blue" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>1-Tık Pazar Yeri API'si</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amazon, Shopify, ETSY gibi pazar yeri mağazalarınızı sadece giriş yaparak onaylayın. Veriler otonom olarak senkronize edilir.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', width: '300px', textAlign: 'left', transition: 'all 0.3s' }}>
            <Database size={32} className="neon-text-purple" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>ERP Webhook & REST API</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>SAP, Odoo veya kendi yazılımınıza REST API anahtarı veya asenkron Webhooklar ile anlık nakit ve stok aktarın.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', width: '300px', textAlign: 'left', transition: 'all 0.3s' }}>
            <Zap size={32} className="neon-text-green" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>CSV / Excel Yükleme</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Eski nesil sistemler kullanıyorsanız, akıllı veritabanı eşleştiricisine CSV atın. Formattaki hataları yapay zeka onarsın.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '48px' }}>Kurumsal Abonelik Paketleri</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Starter */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '320px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Başlangıç</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Büyüyen işletmeler ve butik satıcılar için</p>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '24px' }}>$500<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ay</span></div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-main)' }}>
              <li>✓ Akıllı E-Ticaret Trendleri</li>
              <li>✓ Temel Arbitraj Fırsatları</li>
              <li>✓ 10,000 Sipariş / ay</li>
              <li>✓ E-posta Desteği</li>
            </ul>
            <button style={{ width: '100%', background: 'var(--bg-tertiary)', color: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Seç</button>
          </div>

          {/* Professional */}
          <div style={{ position: 'relative', background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(59,130,246,0.1) 100%)', border: '2px solid var(--accent-blue)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '340px', textAlign: 'left', transform: 'scale(1.05)', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-blue)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>EN POPÜLER</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Profesyonel</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Pazar yerlerinde global ölçekleme</p>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '24px', color: 'var(--accent-blue)' }}>$1,500<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ay</span></div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-main)' }}>
              <li>✓ Tüm Başlangıç Özellikleri</li>
              <li>✓ Canlı Lojistik ve Gemi Takibi</li>
              <li>✓ API / Webhook ile ERP Bağlantısı</li>
              <li>✓ Yeşil Ticaret Modülü (CBAM Vergi Tahmini)</li>
              <li>✓ 50,000 Sipariş / ay</li>
            </ul>
            <button style={{ width: '100%', background: 'var(--accent-blue)', color: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Seç</button>
          </div>

          {/* Enterprise */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '320px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Kurumsal</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Büyük ihracatçılar ve global holdingler</p>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '24px' }}>$5,000<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ay</span></div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-main)' }}>
              <li>✓ Sınırsız İşlem Hacmi</li>
              <li>✓ SAP / Oracle Özel Entegrasyon</li>
              <li>✓ Ticaret Savaşları & Hukuk Simülasyonu</li>
              <li>✓ Kişiselleştirilmiş AI Asistan Mimarisi</li>
              <li>✓ 7/24 Özel Yönetici (Account Manager)</li>
            </ul>
            <button style={{ width: '100%', background: 'var(--bg-tertiary)', color: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Seç</button>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>© 2026 TradeMind AI. Tüm Hakları Saklıdır.</p>
        <button onClick={onSuperAdmin} style={{ background: 'transparent', border: 'none', color: 'var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Admin Paneli">
          <Key size={16} />
        </button>
      </footer>
    </div>
  );
};

export default Landing;
