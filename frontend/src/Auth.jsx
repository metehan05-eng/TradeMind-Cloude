import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, ArrowRight, TrendingUp } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPass, setIsFocusedPass] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'apply'

  // Block free email providers
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const emailDomain = email.split('@')[1];
    if (freeEmailDomains.includes(emailDomain)) {
      setErrorMsg("TradeMind kapalı devre bir B2B sistemidir. Lütfen sadece onaylı kurumsal (.com, .net gibi) şirket e-postanızı kullanın.");
      setLoading(false);
      return;
    }
    
    // Test Account Injector
    if (email === 'demo@techtrend.com' && password === 'admin') {
      setTimeout(() => {
        onLoginSuccess({ email: 'demo@techtrend.com', name: 'TechTrend E-Ticaret' });
      }, 800);
      return;
    }

    // Default mock failure for wrong accounts
    if (supabase.supabaseUrl === 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co') {
      setTimeout(() => {
        setErrorMsg("Böyle bir kurumsal hesap bulunamadı veya şifre hatalı.");
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // If connected to real supabase, you would fetch company info here
      onLoginSuccess({ email: data.user.email, name: 'Kurumsal Şirket' });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div className="auth-header">
          <div className="brand-icon neon-border-blue" style={{ margin: '0 auto 16px auto' }}>
            <TrendingUp size={24} />
          </div>
          <h2 style={{ marginBottom: '8px' }}>TradeMind AI</h2>
          <p style={{ color: 'var(--text-muted)' }}>İşletme paneline giriş yapın</p>
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
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocusedEmail(true)}
                  onBlur={() => setIsFocusedEmail(false)}
                />
              </div>

              <div className={`auth-input-group ${isFocusedPass ? 'focused' : ''}`}>
                <Lock size={20} className="text-muted" />
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="Güvenlik Şifresi" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocusedPass(true)}
                  onBlur={() => setIsFocusedPass(false)}
                />
              </div>

              {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '4px' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="auth-btn neon-border-blue" disabled={loading} style={{ border: 'none' }}>
                {loading ? 'Sistem Doğrulanıyor...' : 'Merkez Panele Bağlan'} <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--accent-blue)', padding: '16px', borderRadius: '8px', marginTop: '16px', fontSize: '0.85rem', textAlign: 'left' }}>
              <p style={{ color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>🧪 Test Hesabı (Onaylı Şirket)</p>
              <p style={{ color: 'var(--text-muted)' }}>E-Posta: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>demo@techtrend.com</code></p>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Şifre: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>admin</code></p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                İşletmeniz TradeMind ağında yok mu?
              </p>
              <button 
                onClick={() => setAuthMode('apply')} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}
              >
                Kurum Olarak Başvuru Yapın
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              TradeMind AI sadece onaylı ihracatçılar ve global ölçeği olan işletmeler içindir. Başvurunuz "Super Admin" ekibimizce kurumsal vergi numaralarınız üzerinden denetlendikten sonra aktif edilecektir.
            </p>
            <button 
                onClick={() => setAuthMode('login')} 
                style={{ background: 'none', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', marginTop: '8px', cursor: 'pointer' }}
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
