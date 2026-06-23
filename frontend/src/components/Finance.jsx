import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Receipt, PiggyBank, Shield, AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight, Wallet, Banknote, BarChart3 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Finance = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultCashFlow = [
    { name: 'Oca', gelir: 4000, gider: 2400 },
    { name: 'Şub', gelir: 3000, gider: 1398 },
    { name: 'Mar', gelir: 2000, gider: 9800 },
    { name: 'Nis', gelir: 2780, gider: 3908 },
    { name: 'May', gelir: 1890, gider: 4800 },
    { name: 'Haz', gelir: 2390, gider: 3800 },
    { name: 'Tem', gelir: 3490, gider: 4300 },
  ];

  const giderDagilimi = [
    { name: 'Lojistik', value: 35 },
    { name: 'Hammadde', value: 25 },
    { name: 'Vergi', value: 15 },
    { name: 'Pazarlama', value: 12 },
    { name: 'İşletme', value: 8 },
    { name: 'Diğer', value: 5 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (supabase.supabaseUrl === 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co') {
          setCashFlowData(defaultCashFlow);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('business_finance')
          .select('revenue, expenses, recorded_at')
          .order('recorded_at', { ascending: true })
          .limit(7);

        if (error || !data.length) {
          setCashFlowData(defaultCashFlow);
        } else {
          const formatted = data.map((item, index) => ({
            name: `Ay ${index + 1}`,
            gelir: item.revenue,
            gider: item.expenses
          }));
          setCashFlowData(formatted);
        }
      } catch (err) {
        setCashFlowData(defaultCashFlow);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalGelir = cashFlowData.reduce((sum, item) => sum + item.gelir, 0);
  const totalGider = cashFlowData.reduce((sum, item) => sum + item.gider, 0);
  const netKar = totalGelir - totalGider;
  const vergiBorcu = Math.round(totalGelir * 0.2);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Finans & Nakit Akışı</h1>
        <p>Harcama, gelir dengesi, vergi optimizasyonu ve finansal sağlık analizi.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-blue)', boxShadow: 'var(--glow-blue)' }}>
          <div className="stat-header">
            <span>Toplam Gelir</span>
            <TrendingUp size={20} className="stat-icon neon-text-blue" />
          </div>
          <div className="stat-value neon-text-blue">${totalGelir.toLocaleString()}</div>
          <div className="stat-footer">
            <span className="trend-up">
              <ArrowUpRight size={14} /> +%12.5
            </span>
            <span style={{color: 'var(--text-muted)'}}>Geçen döneme göre</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}>
          <div className="stat-header">
            <span>Toplam Gider</span>
            <TrendingDown size={20} className="stat-icon" style={{color: '#ef4444'}} />
          </div>
          <div className="stat-value" style={{color: '#ef4444'}}>${totalGider.toLocaleString()}</div>
          <div className="stat-footer">
            <span className="trend-down">
              <ArrowDownRight size={14} /> +%3.2
            </span>
            <span style={{color: 'var(--text-muted)'}}>Enflasyon etkisi</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-green)', boxShadow: 'var(--glow-green)' }}>
          <div className="stat-header">
            <span>Net Kâr</span>
            <Wallet size={20} className="stat-icon neon-text-green" />
          </div>
          <div className="stat-value neon-text-green">${netKar.toLocaleString()}</div>
          <div className="stat-footer">
            <span className="trend-up">
              <ArrowUpRight size={14} /> +%8.3
            </span>
            <span style={{color: 'var(--text-muted)'}}>Kârlılık oranı</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-purple)', boxShadow: 'var(--glow-purple)' }}>
          <div className="stat-header">
            <span>Vergi Borcu</span>
            <Receipt size={20} className="stat-icon neon-text-purple" />
          </div>
          <div className="stat-value neon-text-purple">${vergiBorcu.toLocaleString()}</div>
          <div className="stat-footer">
            <span className="badge action">Optimize Et</span>
            <span style={{color: 'var(--text-muted)'}}>KDV iadesi bekleniyor</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel glass-panel">
          <div className="panel-title neon-text-blue">
            <BarChart3 className="neon-text-blue" size={20} />
            Nakit Akışı (Cash Flow)
            {loading && <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginLeft: '12px' }}>Yükleniyor...</span>}
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="financeColorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="financeColorGider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2dd4bf22" />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1b2333', borderColor: '#2dd4bf22' }} />
                <Area type="monotone" dataKey="gelir" stroke="#10b981" fillOpacity={1} fill="url(#financeColorGelir)" name="Gelir" />
                <Area type="monotone" dataKey="gider" stroke="#ef4444" fillOpacity={1} fill="url(#financeColorGider)" name="Gider" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel glass-panel">
          <div className="panel-title neon-text-purple">
            <PiggyBank className="neon-text-purple" size={20} />
            Gider Dağılımı
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={giderDagilimi}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {giderDagilimi.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1b2333', borderColor: '#2dd4bf22' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="finance-legend">
            {giderDagilimi.map((item, index) => (
              <div key={item.name} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">%{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        <div className="panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title neon-text-green">
            <Sparkles className="neon-text-green" size={20} />
            TradeMind AI Finans Kararları
          </div>

          <div className="ai-insight-box" style={{ borderColor: 'var(--accent-green)' }}>
            <div className="ai-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}>
              <DollarSign size={24} />
            </div>
            <div className="ai-content">
              <h4>Nakit Akışı Optimizasyonu</h4>
              <p>Gelecek ayki nakit akışının %15 artması bekleniyor. Mevcut likiditen WTO standartlarının üzerinde.</p>
              <div className="badge success">Güçlü Likidite</div>
            </div>
          </div>

          <div className="ai-insight-box" style={{ borderColor: '#f59e0b' }}>
            <div className="ai-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Shield size={24} />
            </div>
            <div className="ai-content">
              <h4>Vergi Optimizasyonu</h4>
              <p>KDV iadesi ve yatırım teşvikleriyle vergi yükünü %20 oranında azaltma potansiyelin bulunuyor.</p>
              <div className="badge action">Fırsat Görüldü</div>
            </div>
          </div>

          <div className="ai-insight-box" style={{ borderColor: '#ef4444', flex: 1, marginBottom: 0 }}>
            <div className="ai-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="ai-content">
              <h4>Gider Uyarısı</h4>
              <p>Mart ayında lojistik kaynaklı ani gider artışı tespit edildi. Alternatif tedarikçi değerlendirmesi önerilir.</p>
              <div className="badge alert">Aksiyon Gerekli</div>
            </div>
          </div>
        </div>

        <div className="panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title neon-text-blue">
            <BarChart3 className="neon-text-blue" size={20} />
            Finansal Sağlık Metrikleri
          </div>

          <div className="health-metric">
            <div className="metric-header">
              <span>Cari Oran</span>
              <span className="metric-value good">2.4</span>
            </div>
            <div className="metric-bar">
              <div className="metric-bar-fill good" style={{ width: '80%' }} />
            </div>
            <div className="metric-footer">
              <span className="metric-desc">WTO ortalaması: 1.5</span>
              <span className="metric-status">İyi</span>
            </div>
          </div>

          <div className="health-metric">
            <div className="metric-header">
              <span>Kârlılık Oranı</span>
              <span className="metric-value good">%18.5</span>
            </div>
            <div className="metric-bar">
              <div className="metric-bar-fill good" style={{ width: '75%' }} />
            </div>
            <div className="metric-footer">
              <span className="metric-desc">Sektör ortalaması: %12</span>
              <span className="metric-status">İyi</span>
            </div>
          </div>

          <div className="health-metric">
            <div className="metric-header">
              <span>Borç/Özkaynak</span>
              <span className="metric-value warning">0.8</span>
            </div>
            <div className="metric-bar">
              <div className="metric-bar-fill warning" style={{ width: '45%' }} />
            </div>
            <div className="metric-footer">
              <span className="metric-desc">İdeal: &lt; 1.0</span>
              <span className="metric-status">İzle</span>
            </div>
          </div>

          <div className="health-metric">
            <div className="metric-header">
              <span>Nakit Dönüşüm</span>
              <span className="metric-value good">28 gün</span>
            </div>
            <div className="metric-bar">
              <div className="metric-bar-fill good" style={{ width: '70%' }} />
            </div>
            <div className="metric-footer">
              <span className="metric-desc">WTO ortalaması: 35 gün</span>
              <span className="metric-status">Güçlü</span>
            </div>
          </div>

          <div className="health-metric" style={{ marginBottom: 0 }}>
            <div className="metric-header">
              <span>Stok Devir Hızı</span>
              <span className="metric-value good">6.2</span>
            </div>
            <div className="metric-bar">
              <div className="metric-bar-fill good" style={{ width: '65%' }} />
            </div>
            <div className="metric-footer">
              <span className="metric-desc">Sektör ortalaması: 4.5</span>
              <span className="metric-status">Verimli</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
