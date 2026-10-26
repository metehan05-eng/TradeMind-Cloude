import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, Copy, AlertTriangle, Loader } from 'lucide-react';
import { api, storeSession } from '../lib/apiClient';

const DemoConfirmPage = ({ onLoginSuccess }) => {
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setError('Onay bağlantısı geçersiz: token bulunamadı.');
      setStatus('error');
      return;
    }
    api.demoConfirm(token)
      .then((provisioned) => { setResult(provisioned); setStatus('ready'); })
      .catch((err) => { setError(err.message); setStatus('error'); });
  }, []);

  const enterPanel = async () => {
    setStatus('loading');
    try {
      const session = await api.login({ email: result.email, password: result.temporaryPassword });
      storeSession(session);
      onLoginSuccess({ ...session.user, name: session.user.fullName, tenant: session.tenant, rbac: session.rbac });
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        {status === 'loading' && (
          <div className="demo-form success-state">
            <Loader size={28} className="spin" />
            <h3>Sandbox hesabınız oluşturuluyor</h3>
            <p className="text-muted">Kurumsal demo verileriniz ve örnek portföyünüz hazırlanıyor.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="demo-form success-state">
            <AlertTriangle size={28} color="#f59e0b" />
            <h3>Onay tamamlanamadı</h3>
            <p className="text-muted">{error}</p>
            <a className="auth-btn neon-border-blue" href="/" style={{ textDecoration: 'none' }}>Giriş ekranına dön</a>
          </div>
        )}

        {status === 'ready' && result && (
          <div className="demo-form success-state">
            <div className="demo-success-icon"><ShieldCheck size={28} /></div>
            <h3>Kurumsal demo hesabınız hazır</h3>
            <p className="text-muted">{result.seededPortfolio.join(' · ')}</p>
            <div className="demo-credentials">
              <div><span>E-posta</span><strong>{result.email}</strong></div>
              <div>
                <span>Geçici şifre</span>
                <strong className="mono">{result.temporaryPassword}</strong>
                <button type="button" className="icon-btn" onClick={() => navigator.clipboard?.writeText(result.temporaryPassword)}>
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <button type="button" className="auth-btn neon-border-purple" onClick={enterPanel}>
              Sandbox paneline gir <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoConfirmPage;
