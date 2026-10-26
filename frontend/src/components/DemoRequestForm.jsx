import React, { useState } from 'react';
import { Building2, ArrowRight, CheckCircle, Copy, ShieldCheck, Mail } from 'lucide-react';
import { api, ApiError } from '../lib/apiClient';

const VOLUMES = [
  { value: 'under_500k', label: '< $500K' },
  { value: '500k_2m', label: '$500K – $2M' },
  { value: '2m_10m', label: '$2M – $10M' },
  { value: '10m_50m', label: '$10M – $50M' },
  { value: '50m_plus', label: '$50M+' }
];

const ERPS = [
  { value: 'sap', label: 'SAP' },
  { value: 'oracle_netsuite', label: 'Oracle NetSuite' },
  { value: 'logo', label: 'Logo' },
  { value: 'mikro', label: 'Mikro' },
  { value: 'odoo', label: 'Odoo' },
  { value: 'none', label: 'Henüz yok' },
  { value: 'other', label: 'Diğer' }
];

const MARKETPLACES = [
  { value: 'amazon', label: 'Amazon Seller Central' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'trendyol', label: 'Trendyol' },
  { value: 'none', label: 'Yok' },
  { value: 'other', label: 'Diğer' }
];

const initialForm = {
  businessEmail: '',
  companyName: '',
  jobTitle: '',
  annualTradeVolume: '2m_10m',
  primaryErp: 'sap',
  primaryMarketplace: 'amazon',
  source: 'landing'
};

const DemoRequestForm = ({ source = 'landing', compact = false }) => {
  const [form, setForm] = useState({ ...initialForm, source });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [provisioned, setProvisioned] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.demoRequest(form);
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo talebi gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSandbox = async () => {
    if (!result?.devToken) return;
    setConfirming(true);
    setError(null);
    try {
      const response = await api.demoConfirm(result.devToken);
      setProvisioned(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (provisioned) {
    return (
      <div className="demo-form success-state">
        <div className="demo-success-icon"><ShieldCheck size={28} /></div>
        <h3>Sandbox hazır</h3>
        <p className="text-muted">
          {provisioned.email} için onaylı demo hesabı oluşturuldu. Örnek NVDA, BTC/USD ve Brent Oil
          portföyü yüklendi.
        </p>
        <div className="demo-credentials">
          <div><span>E-posta</span><strong>{provisioned.email}</strong></div>
          <div>
            <span>Geçici şifre</span>
            <strong className="mono">{provisioned.temporaryPassword}</strong>
            <button
              type="button"
              className="icon-btn"
              title="Kopyala"
              onClick={() => navigator.clipboard?.writeText(provisioned.temporaryPassword)}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        <a className="auth-btn neon-border-blue" href="/" style={{ textDecoration: 'none' }}>
          Giriş ekranına git <ArrowRight size={18} />
        </a>
      </div>
    );
  }

  if (result) {
    return (
      <div className="demo-form success-state">
        <div className="demo-success-icon"><Mail size={28} /></div>
        <h3>Talebiniz alındı</h3>
        <p className="text-muted">
          <strong>{result.leadScore}/100</strong> lead skoruyla CRM ekibine iletildi. Onay bağlantısı
          kurumsal e-posta adresinize gönderildi.
        </p>
        {result.devConfirmationUrl && (
          <div className="demo-dev-box">
            <span>Geliştirme modu</span>
            <p>E-posta kutusuna erişemiyorsanız sandbox hesabını hemen oluşturabilirsiniz.</p>
            <button type="button" className="auth-btn neon-border-blue" onClick={confirmSandbox} disabled={confirming}>
              {confirming ? 'Sandbox oluşturuluyor...' : 'Sandbox hesabını oluştur'}
            </button>
          </div>
        )}
        <button type="button" className="demo-link-btn" onClick={() => { setResult(null); setProvisioned(null); }}>
          Yeni talep oluştur
        </button>
      </div>
    );
  }

  return (
    <form className={`demo-form ${compact ? 'compact' : ''}`} onSubmit={submit}>
      <div className="demo-form-heading">
        <div className="brand-icon neon-border-purple"><Building2 size={22} /></div>
        <div>
          <h3>Kurum Olarak Başvuru Yapın</h3>
          <p>Onaylı kurumsal demo hesabınızı ve örnek portföyünüzü oluşturalım.</p>
        </div>
      </div>

      <div className="demo-form-grid">
        <label>
          <span>İş E-postası</span>
          <input type="email" required value={form.businessEmail} onChange={update('businessEmail')} placeholder="cfo@sirketiniz.com" />
        </label>
        <label>
          <span>Şirket Adı</span>
          <input type="text" required value={form.companyName} onChange={update('companyName')} placeholder="Örn. Nexus Lojistik A.Ş." />
        </label>
        <label>
          <span>Görev / Unvan</span>
          <input type="text" required value={form.jobTitle} onChange={update('jobTitle')} placeholder="CFO / Head of Procurement" />
        </label>
        <label>
          <span>Yıllık İthalat / İhracat Hacmi</span>
          <select value={form.annualTradeVolume} onChange={update('annualTradeVolume')}>
            {VOLUMES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Birincil ERP</span>
          <select value={form.primaryErp} onChange={update('primaryErp')}>
            {ERPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Birincil Pazar Yeri</span>
          <select value={form.primaryMarketplace} onChange={update('primaryMarketplace')}>
            {MARKETPLACES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="demo-error">{error}</div>}

      <button type="submit" className="auth-btn neon-border-purple" disabled={loading}>
        {loading ? 'Gönderiliyor...' : 'Kurumsal Demo Talebi Gönder'} <ArrowRight size={18} />
      </button>
      <p className="demo-consent">
        <CheckCircle size={13} /> Yalnızca kurumsal e-posta adresleri kabul edilir. Gmail, Outlook ve
        benzeri ücretsiz adresler reddedilir.
      </p>
    </form>
  );
};

export default DemoRequestForm;
