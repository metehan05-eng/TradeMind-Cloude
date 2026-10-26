import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Loader } from 'lucide-react';
import { api, storeSession, clearSession } from '../lib/apiClient';

const SsoCallbackPage = ({ onLoginSuccess }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('SSO oturum bilgisi eksik.');
      return;
    }

    storeSession({ accessToken, refreshToken });
    api.me()
      .then((data) => {
        onLoginSuccess({ ...data.user, name: data.user.fullName, tenant: data.tenant, rbac: data.rbac });
      })
      .catch((err) => {
        clearSession();
        setError(err.message);
      });
  }, [onLoginSuccess]);

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="demo-form success-state">
          {error ? (
            <>
              <AlertTriangle size={28} color="#f59e0b" />
              <h3>SSO girişi tamamlanamadı</h3>
              <p className="text-muted">{error}</p>
              <a className="auth-btn neon-border-blue" href="/" style={{ textDecoration: 'none' }}>Giriş ekranına dön</a>
            </>
          ) : (
            <>
              <Loader size={28} className="spin" />
              <h3><ShieldCheck size={20} /> Kurumsal kimliğiniz doğrulanıyor</h3>
              <p className="text-muted">Identity Provider yanıtı işleniyor...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SsoCallbackPage;
