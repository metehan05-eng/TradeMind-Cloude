import React, { useCallback, useEffect, useState } from 'react';
import { Link2, Key, Bell, RefreshCw, Trash2, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { api, getAccessToken, ApiError } from '../lib/apiClient';

const SCOPES = [
  { value: 'ingestion:write', label: 'Veri ingestion' },
  { value: 'financials:read', label: 'Finansal okuma' },
  { value: 'supplychain:read', label: 'Tedarik zinciri' },
  { value: 'market:read', label: 'Piyasa verisi' }
];

const IntegrationHub = () => {
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [keyForm, setKeyForm] = useState({ name: 'ERP Production Key', scopes: ['ingestion:write'] });
  const [channelForm, setChannelForm] = useState({ type: 'slack', label: 'Finance Alerts', endpoint: '', events: ['alert.arbitrage'] });

  const hasToken = Boolean(getAccessToken());

  const load = useCallback(async () => {
    if (!hasToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      api.providers(),
      api.connections(),
      api.apiKeys(),
      api.notificationChannels()
    ]);
    if (results[0].status === 'fulfilled') setProviders(results[0].value);
    if (results[1].status === 'fulfilled') setConnections(results[1].value);
    if (results[2].status === 'fulfilled') setApiKeys(results[2].value);
    if (results[3].status === 'fulfilled') setChannels(results[3].value);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) setError(failure.reason?.message || 'Entegrasyon verileri yüklenemedi.');
    setLoading(false);
  }, [hasToken]);

  useEffect(() => { load(); }, [load]);

  const connect = async (provider) => {
    setError(null);
    try {
      const authorization = await api.authorizeProvider(provider);
      if (authorization.mockMode) {
        await api.connectSandbox(provider);
        await load();
      } else {
        window.location.href = authorization.authorizationUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bağlantı başlatılamadı.');
    }
  };

  const connectSandbox = async (provider) => {
    setError(null);
    try {
      await api.connectSandbox(provider);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sandbox bağlantısı kurulamadı.');
    }
  };

  const disconnect = async (id) => {
    try { await api.disconnect(id); await load(); } catch (err) { setError(err.message); }
  };

  const createKey = async (event) => {
    event.preventDefault();
    try {
      const created = await api.createApiKey(keyForm);
      setNewKey(created);
      await load();
    } catch (err) { setError(err.message); }
  };

  const revokeKey = async (id) => {
    try { await api.revokeApiKey(id); await load(); } catch (err) { setError(err.message); }
  };

  const createChannel = async (event) => {
    event.preventDefault();
    try {
      await api.createNotificationChannel(channelForm);
      setChannelForm({ type: 'slack', label: 'Finance Alerts', endpoint: '', events: ['alert.arbitrage'] });
      await load();
    } catch (err) { setError(err.message); }
  };

  if (!hasToken) {
    return (
      <div className="panel">
        <div className="panel-title"><Link2 size={20} /> Entegrasyon Merkezi</div>
        <p className="text-muted">Entegrasyonları yönetmek için kurumsal hesabınızla giriş yapın.</p>
      </div>
    );
  }

  return (
    <div className="integration-hub">
      <div className="panel">
        <div className="panel-title" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Link2 size={20} /> Pazar Yeri Bağlantıları</span>
          <button type="button" className="icon-btn" onClick={load} title="Yenile"><RefreshCw size={16} /></button>
        </div>
        <p className="text-muted">OAuth 2.0 ile Amazon, Shopify, Etsy ve Trendyol mağazalarınızı bağlayın. Token'lar AES-256-GCM ile şifrelenir.</p>
        {error && <div className="demo-error"><AlertTriangle size={14} /> {error}</div>}
        <div className="integration-grid">
          {providers.map((provider) => {
            const connection = connections.find((item) => item.provider === provider.key);
            return (
              <div key={provider.key} className={`integration-card ${connection ? 'connected' : ''}`}>
                <div>
                  <strong>{provider.label}</strong>
                  <span className="integration-scopes">{provider.scopes.slice(0, 3).join(' · ')}</span>
                </div>
                {connection ? (
                  <div className="integration-actions">
                    <span className="badge success"><CheckCircle size={12} /> {connection.accountLabel}</span>
                    <button type="button" className="icon-btn danger" onClick={() => disconnect(connection.id)} title="Bağlantıyı kes">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="integration-actions">
                    <button type="button" className="mini-btn" onClick={() => connect(provider.key)}>
                      {provider.configured ? 'Bağlan' : 'Sandbox Bağla'}
                    </button>
                    {!provider.configured && (
                      <button type="button" className="mini-btn ghost" onClick={() => connectSandbox(provider.key)}>Sandbox</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && providers.length === 0 && <p className="text-muted">Sağlayıcı listesi boş.</p>}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title"><Key size={20} /> ERP API Anahtarları</div>
          <p className="text-muted">Webhook ve REST entegrasyonları için granular yetkili anahtar üretin. Anahtar ve HMAC secret yalnızca bir kez gösterilir.</p>
          {newKey && (
            <div className="demo-credentials" style={{ marginBottom: '16px' }}>
              <div><span>API Key</span><strong className="mono">{newKey.apiKey}</strong></div>
              <div><span>Signing Secret</span><strong className="mono">{newKey.signingSecret}</strong></div>
            </div>
          )}
          <form className="inline-form" onSubmit={createKey}>
            <input value={keyForm.name} onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} placeholder="Anahtar adı" />
            <select
              multiple
              value={keyForm.scopes}
              onChange={(e) => setKeyForm({ ...keyForm, scopes: Array.from(e.target.selectedOptions).map((option) => option.value) })}
            >
              {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
            </select>
            <button type="submit" className="mini-btn"><Plus size={14} /> Üret</button>
          </form>
          <div className="integration-list">
            {apiKeys.map((key) => (
              <div key={key.id} className="integration-row">
                <div><strong>{key.name}</strong><span className="mono">{key.prefix}_••••</span></div>
                <button type="button" className="icon-btn danger" onClick={() => revokeKey(key.id)}><Trash2 size={14} /></button>
              </div>
            ))}
            {!loading && apiKeys.length === 0 && <p className="text-muted">Henüz API anahtarı yok.</p>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title"><Bell size={20} /> Otonom Alarm Kanalları</div>
          <p className="text-muted">Arbitraj ve tedarik zinciri sinyallerini Slack, Teams veya e-posta webhook'larına iletin.</p>
          <form className="inline-form" onSubmit={createChannel}>
            <select value={channelForm.type} onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}>
              <option value="slack">Slack</option>
              <option value="teams">Microsoft Teams</option>
              <option value="email">E-posta</option>
            </select>
            <input value={channelForm.label} onChange={(e) => setChannelForm({ ...channelForm, label: e.target.value })} placeholder="Kanal adı" />
            <input
              value={channelForm.endpoint}
              onChange={(e) => setChannelForm({ ...channelForm, endpoint: e.target.value })}
              placeholder={channelForm.type === 'email' ? 'cfo@sirketiniz.com' : 'https://hooks.slack.com/...'}
            />
            <button type="submit" className="mini-btn"><Plus size={14} /> Ekle</button>
          </form>
          <div className="integration-list">
            {channels.map((channel) => (
              <div key={channel.id} className="integration-row">
                <div><strong>{channel.label}</strong><span>{channel.type} · {channel.endpointPreview}</span></div>
                <span className={`badge ${channel.enabled ? 'success' : 'alert'}`}>{channel.enabled ? 'Aktif' : 'Pasif'}</span>
              </div>
            ))}
            {!loading && channels.length === 0 && <p className="text-muted">Henüz alarm kanalı yok.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationHub;
