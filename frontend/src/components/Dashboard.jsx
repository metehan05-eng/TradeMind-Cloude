import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Package, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback Dummy Data
  const defaultCashFlow = [
    { name: 'Oca', gelir: 4000, gider: 2400 },
    { name: 'Şub', gelir: 3000, gider: 1398 },
    { name: 'Mar', gelir: 2000, gider: 9800 },
    { name: 'Nis', gelir: 2780, gider: 3908 },
    { name: 'May', gelir: 1890, gider: 4800 },
    { name: 'Haz', gelir: 2390, gider: 3800 },
    { name: 'Tem', gelir: 3490, gider: 4300 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Supabase henüz bağlanmadıysa veya demo moddaysak
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
          console.warn("Veri çekilemedi, Demo data'ya dönülüyor...", error);
          setCashFlowData(defaultCashFlow);
        } else {
          // Format Data for Recharts
          const formatted = data.map((item, index) => ({
            name: `Ay ${index + 1}`,
            gelir: item.revenue,
            gider: item.expenses
          }));
          setCashFlowData(formatted);
        }
      } catch (err) {
        console.error("Supabase API Hatası:", err);
        setCashFlowData(defaultCashFlow);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Genel Yönetim Paneli</h1>
        <p>İşletme finansı, stok riskleri ve yapay zeka destekli performans analizi.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-blue)', boxShadow: 'var(--glow-blue)' }}>
          <div className="stat-header">
            <span>Toplam Gelir</span>
            <DollarSign size={20} className="stat-icon neon-text-blue" />
          </div>
          <div className="stat-value neon-text-blue">$124,500</div>
          <div className="stat-footer">
            <span className="trend-up">+12.5%</span> 
            <span style={{color: 'var(--text-muted)'}}>Geçen aya göre</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-purple)', boxShadow: 'var(--glow-purple)' }}>
          <div className="stat-header">
            <span>Stok Maliyeti</span>
            <Package size={20} className="stat-icon neon-text-purple" />
          </div>
          <div className="stat-value neon-text-purple">$45,200</div>
          <div className="stat-footer">
            <span className="trend-down">-2.4%</span> 
            <span style={{color: 'var(--text-muted)'}}>Depo optimizasyonu</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--neon-green)', boxShadow: 'var(--glow-green)' }}>
          <div className="stat-header">
            <span>KPI Hedeflenen</span>
            <TrendingUp size={20} className="stat-icon neon-text-green" />
          </div>
          <div className="stat-value neon-text-green">84%</div>
          <div className="stat-footer">
            <span className="trend-up">+5.2%</span> 
            <span style={{color: 'var(--text-muted)'}}>WTO Ortalama Üstü</span>
          </div>
        </div>
      </div>

      {/* AI Insights & Charts */}
      <div className="dashboard-grid">
        <div className="panel glass-panel">
          <div className="panel-title neon-text-blue">
            <Activity className="neon-text-blue" size={20} />
            Nakit Akışı (Cash Flow) Tahmini
            {loading && <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginLeft: '12px' }}>Yükleniyor...</span>}
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2dd4bf22" />
                <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1b2333', borderColor: '#2dd4bf22' }} />
                <Area type="monotone" dataKey="gelir" stroke="#10b981" fillOpacity={1} fill="url(#colorGelir)" />
                <Area type="monotone" dataKey="gider" stroke="#ef4444" fillOpacity={1} fill="url(#colorGider)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title neon-text-purple">
            <Sparkles className="neon-text-purple" size={20} />
            TradeMind AI Karar Notları
          </div>
          
          <div className="ai-insight-box" style={{ borderColor: 'var(--accent-green)' }}>
             <div className="ai-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}>
                <DollarSign size={24} />
             </div>
             <div className="ai-content">
                <h4>Nakit Akışı Tahmini</h4>
                <p>Gelecek ayki hammadde alımın ve beklenen e-ticaret gelirlerin dengelendiğinde kasan +%15'te olacak.</p>
                <div className="badge success">Güvenli Nakit</div>
             </div>
          </div>

          <div className="ai-insight-box" style={{ borderColor: '#ef4444' }}>
             <div className="ai-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
             </div>
             <div className="ai-content">
                <h4>Akıllı Stok Yönetimi</h4>
                <p>Lojistik modülünden gelen veriye göre gemin gecikiyor; elindeki e-ticaret stoğunu korumak için reklam bütçeni %20 kıs.</p>
                <div className="badge alert">Acil Aksiyon</div>
             </div>
          </div>

          <div className="ai-insight-box" style={{ borderColor: 'var(--accent-blue)', flex: 1, marginBottom: 0 }}>
             <div className="ai-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
                <TrendingUp size={24} />
             </div>
             <div className="ai-content">
                <h4>KPI & WTO Kıyaslaması</h4>
                <p>Şirketinin %12.5 büyüme oranı, global ticaret standartlarına (WTO %4.2) göre oldukça başarılı. Arbitraj fırsatlarıyla Avrupa pazarına yönel.</p>
                <div className="badge action">Fırsat Görüldü</div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
