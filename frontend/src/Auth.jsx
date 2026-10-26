import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, TrendingUp, ShieldCheck, Building2 } from 'lucide-react';
import { api, ApiError, storeSession } from './lib/apiClient';
import DemoRequestForm from './components/DemoRequestForm';

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'icloud.com', 'me.com', 'protonmail.com', 'proton.me',
  'yandex.com', 'mail.ru', 'zoho.com', 'aol.com'
];

const Auth = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPass, setIsFocusedPass] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [ssoDiscovery, setSsoDiscovery] = useState(null);

  const validateCorporateEmail = () => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || FREE_EMAIL_DOMAINS.includes(domain)) {
      setErrorMsg('TradeMind kapalı devre bir B2B sistemidir. Lütfen kurumsal şirket e-postanızı kullanın.');
      return false;
    }
    return true;
  };

  const discoverSso = async () => {
    if (!email.includes('@') || !validateCorporateEmail()) return;
    try {
      const discovery = await api.discoverSso(email);
      if (discovery.mode === 'blocked') {
        setErrorMsg(discovery.message);
        return;
      }
      setSsoDiscovery(discovery.mode === 'sso' ? discovery : null);
    } catch {
      setSsoDiscovery(null);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!validateCorporateEmail()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const session = await api.login({ email, password });
      storeSession(session);
      onLoginSuccess({
        ...session.user,
        name: session.user.fullName,
        tenant: session.tenant,
        rbac: session.rbac
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'TradeMind backend servisine ulaşılamadı. Lütfen servisin çalıştığını kontrol edin.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const continueWithSso = () => {
    if (ssoDiscovery?.startUrl) window.location.href = ssoDiscovery.startUrl;
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div className="auth-header">
          <div className="brand-icon neon-border-blue" style={{ margin: '0 auto 16px auto' }}>
            <TrendingUp size={24} />
          </div>
          <h2 style={{ marginBottom: '8px' }}>TradeMind AI</h2>
          <p style={{ color: 'var(--text-muted)' }}>Kurumsal işletme paneline giriş yapın</p>
        </div>

        {authMode === 'login' ? (
          <>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={`auth-input-group ${isFocusedEmail ? 'focused' : ''}`}>
                <Mail size={20} className="text-muted" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Kurumsal Şirket E-postası"
                  required
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setSsoDiscovery(null); }}
                  onFocus={() => setIsFocusedEmail(true)}
                  onBlur={() => { setIsFocusedEmail(false); discoverSso(); }}
                />
              </div>

              {ssoDiscovery?.mode === 'sso' && (
                <div className="sso-banner">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>{ssoDiscovery.idpName} ile kurumsal giriş</strong>
                    <p>Bu domain {ssoDiscovery.idpName} Identity Provider'ına yönlendirilir.</p>
                  </div>
                  <button type="button" onClick={continueWithSso} className="mini-btn">
                    SSO ile Devam
                  </button>
                </div>
              )}

              <div className={`auth-input-group ${isFocusedPass ? 'focused' : ''}`}>
                <Lock size={20} className="text-muted" />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Güvenlik Şifresi"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setIsFocusedPass(true)}
                  onBlur={() => setIsFocusedPass(false)}
                />
              </div>

              {errorMsg && <div className="demo-error">{errorMsg}</div>}

              <button type="submit" className="auth-btn neon-border-blue" disabled={loading} style={{ border: 'none' }}>
                {loading ? 'Sistem Doğrulanıyor...' : 'Merkez Panele Bağlan'} <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--accent-blue)', padding: '16px', borderRadius: '8px', marginTop: '16px', fontSize: '0.85rem', textAlign: 'left' }}>
              <p style={{ color: 'white', marginBottom: '8px', fontWeight: 'bold' }}><Building2 size={14} /> Test Hesabı (Onaylı Şirket)</p>
              <p style={{ color: 'var(--text-muted)' }}>E-Posta: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>demo@techtrend.com</code></p>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Şifre: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>admin</code></p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                İşletmeniz TradeMind ağında yok mu?
              </p>
              <button
                type="button"
                onClick={() => setAuthMode('apply')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}
              >
                Kurum Olarak Başvuru Yapın
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              TradeMind AI yalnızca doğrulanmış kurumsal hesaplar içindir. Demo talebiniz KYB ve domain
              kontrolünden geçtikten sonra sandbox hesabınız otomatik oluşturulur.
            </p>
            <DemoRequestForm source="auth" compact />
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              style={{ background: 'none', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Giriş Ekranına Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
