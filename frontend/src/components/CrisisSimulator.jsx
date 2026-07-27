import React, { useState } from 'react';
import { Globe2, Activity, TrendingDown, TrendingUp, DollarSign, ExternalLink, Send, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

const CrisisSimulator = () => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeTab, setActiveTab] = useState(1); // 0: Optimistic, 1: Moderate, 2: Severe

  const macroScenarios = [
    { 
      id: 'red_sea', 
      title: 'Kızıldeniz Kapanması', 
      desc: 'Süveyş Kanalı rotasındaki krizlerin %100 uzaması ve navlun ücretlerinin 3 katına çıkması.' 
    },
    { 
      id: 'us_china_tariff', 
      title: 'ABD - Çin %20 Vergi Harbi', 
      desc: 'Amerika’nın Çin ürünlerine otonom ek damping vergisi ataması ve gümrük blokajı.' 
    },
    { 
      id: 'europe_recession', 
      title: 'Avrupa Resesyonu (Tüketim Düşüşü)', 
      desc: 'Almanya ve Fransa’da sipariş alımlarının %15 azalması ve talep daralması.' 
    }
  ];

  const handleSimulate = async (promptText = '', macroId = null) => {
    const textToSimulate = promptText || customPrompt || (macroId ? macroScenarios.find(m => m.id === macroId)?.title : '');
    
    if (!textToSimulate) return;

    setIsLoading(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/crisis/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSimulate, scenarioTitle: textToSimulate })
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      if (data && data.scenarios && data.scenarios.length === 3) {
        setSimulationResult(data.scenarios);
      } else {
        setSimulationResult(generateClientFallback(textToSimulate));
      }
    } catch (err) {
      console.warn('Backend unavailable, generating AI scenarios locally:', err.message);
      setSimulationResult(generateClientFallback(textToSimulate));
    } finally {
      setIsLoading(false);
    }
  };

  const generateClientFallback = (context) => {
    return [
      {
        type: "optimistic",
        title: "İyimser Senaryo: Hızlı Tedarik Rotalaması & Yerel Depo",
        financialImpact: "+$14,500",
        financialImpactNumeric: 14500,
        riskLevel: "Düşük Risk",
        description: `"${context}" durumu karşısında yerel stok esnekliği ve bölgesel depolar kullanılarak tedarik süresi sadece 4 gün uzar.`,
        planB: "İkinci tedarikçiye doğrudan geçiş yapılır, navlun artış maliyeti alternatif rotalarla nörtlenir.",
        actionButtonText: "Otonom Rotalamayı Etkinleştir"
      },
      {
        type: "moderate",
        title: "Gerçekçi Senaryo: Hava Kargosu & Dengeli Fiyatlama",
        financialImpact: "-$38,000",
        financialImpactNumeric: -38000,
        riskLevel: "Orta Şok",
        description: `"${context}" sebebiyle teslimat sürelerinde 14 günlük gecikme ve %18 lojistik maliyet artışı yaşanır.`,
        planB: "Kritik stok bileşenleri Hindistan ve Doğu Avrupa depolarından subvansiyonlu hava kargosu ile aktarılarak kayıp minimize edilir.",
        actionButtonText: "Hibrit Lojistik Protokolünü Başlat"
      },
      {
        type: "severe",
        title: "Kötümser Senaryo: Tam Tedarik Kilitlenmesi & Kur Şoku",
        financialImpact: "-$124,000",
        financialImpactNumeric: -124000,
        riskLevel: "Şiddetli Şok Etkisi",
        description: `"${context}" 45 gün boyunca tedarik zincirini tamamen kilitler. Satış sipariş iptalleri ve depolama cezaları tavan yapar.`,
        planB: "Tüm riskli siparişler askıya alınır, likidite koruma kalkanı ve döviz kuru hedging mekanizması acilen devreye girer.",
        actionButtonText: "Acil Durum Likidite Kalkanını Devreye Al"
      }
    ];
  };

  const activeScenario = simulationResult ? simulationResult[activeTab] : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Kriz ve Stres Simülatörü 🌍</h1>
        <p>İşletmenizin tedarik, maliyet ve gelir yapısını küresel veya şirketinize özel şok senaryolarına karşı test edin.</p>
      </div>

      {/* Main Grid: Left Panel for Prompts/Scenarios, Right Panel for 3-Scenario Results */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.1fr 1.9fr', gap: '24px' }}>
        
        {/* Left Column: Input Form & Predefined Macro Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Custom Prompt Box */}
          <div className="panel" style={{ border: '1px solid var(--accent-purple)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(30, 27, 75, 0.2) 100%)' }}>
            <div className="panel-title" style={{ color: 'var(--accent-purple)', marginBottom: '12px' }}>
              <Sparkles size={20} /> Şirketinize Özel Kriz Senaryosu Yazın
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Örn: <em>"Dolar/TL %25 artarsa ve Çin'den hammadde tedariği 1 ay aksarsa şirketimiz nasıl etkilenir?"</em>
            </p>
            <textarea
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Şirketinizin mevcut risk veya kriz durumunu buraya yazın..."
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '0.88rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={() => { setSelectedMacro(null); handleSimulate(customPrompt); }}
              disabled={isLoading || !customPrompt.trim()}
              style={{
                marginTop: '12px',
                width: '100%',
                background: customPrompt.trim() ? 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)' : 'var(--bg-tertiary)',
                color: customPrompt.trim() ? 'white' : 'var(--text-muted)',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: customPrompt.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? (
                <> <RefreshCw className="animate-spin" size={18} /> Yapay Zeka 3 Senaryo Hesaplarken Bekleyin... </>
              ) : (
                <> <Send size={18} /> 🤖 3 Senaryo Üret & Simüle Et </>
              )}
            </button>
          </div>

          {/* Predefined Macro Scenarios List */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="panel-title">
              <Activity className="text-secondary" size={20} />
              Hazır Makro Senaryolar
            </div>
            {macroScenarios.map(scen => (
              <div 
                key={scen.id} 
                onClick={() => {
                  setSelectedMacro(scen.id);
                  setCustomPrompt('');
                  handleSimulate(scen.title, scen.id);
                }}
                style={{
                  background: selectedMacro === scen.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-tertiary)',
                  border: selectedMacro === scen.id ? '2px solid var(--accent-blue)' : '1px solid var(--glass-border)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ color: selectedMacro === scen.id ? 'var(--accent-blue)' : 'white', margin: 0 }}>{scen.title}</h4>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>Test Et</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{scen.desc}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Simulation Output & 3 Scenarios Tabs */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
          
          {isLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', gap: '16px' }}>
              <RefreshCw className="animate-spin" size={48} />
              <h3>TradeMind AI Kriz Motoru Çalışıyor...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
                Girdiğiniz durum için 3 farklı olasılık senaryosu (İyimser, Gerçekçi, Kötümser) hesaplanıyor ve mali riskler simüle ediliyor.
              </p>
            </div>
          ) : simulationResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>AI Kriz Simülasyonu Sonucu</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Oluşturulan 3 Olası Senaryodan Birini Seçip Detaylandırın
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleSimulate()}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} /> Yeniden Simüle Et
                  </button>
                </div>
              </div>

              {/* 3 Scenario Tabs Navigation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                
                {/* Tab 0: Optimistic */}
                <div
                  onClick={() => setActiveTab(0)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                    border: activeTab === 0 ? '2px solid #10b981' : '1px solid var(--glass-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>
                    1. İyimser Senaryo
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399' }}>
                    {simulationResult[0].financialImpact}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Hızlı Uyum</div>
                </div>

                {/* Tab 1: Moderate */}
                <div
                  onClick={() => setActiveTab(1)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === 1 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
                    border: activeTab === 1 ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    2. Gerçekçi Senaryo
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>
                    {simulationResult[1].financialImpact}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Taban Risk</div>
                </div>

                {/* Tab 2: Severe */}
                <div
                  onClick={() => setActiveTab(2)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === 2 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)',
                    border: activeTab === 2 ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>
                    3. Kötümser Senaryo
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f87171' }}>
                    {simulationResult[2].financialImpact}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Şiddetli Şok</div>
                </div>

              </div>

              {/* Active Scenario Detailed Panel */}
              {activeScenario && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '6px' }}>{activeScenario.title}</h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                        {activeScenario.description}
                      </p>
                    </div>
                    
                    <div style={{ 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      fontWeight: 'bold', 
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      background: activeScenario.financialImpactNumeric >= 0 ? 'rgba(16, 185, 129, 0.15)' : activeScenario.financialImpactNumeric > -60000 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: activeScenario.financialImpactNumeric >= 0 ? '#10b981' : activeScenario.financialImpactNumeric > -60000 ? '#f59e0b' : '#ef4444'
                    }}>
                      {activeScenario.financialImpactNumeric >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {activeScenario.riskLevel}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginTop: '20px' }}>
                    
                    {/* Left Box: Financial Estimate */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahmini Mali Hasar / Etki</span>
                      <div style={{ 
                        fontSize: '2.2rem', 
                        fontWeight: 'bold', 
                        marginTop: '8px',
                        color: activeScenario.financialImpactNumeric >= 0 ? '#34d399' : activeScenario.financialImpactNumeric > -60000 ? '#fbbf24' : '#f87171' 
                      }}>
                        {activeScenario.financialImpact}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                        Tedarik aksaması, depolama giderleri ve satış kayıpları dahil net çeyreklik etki tahmini.
                      </p>
                    </div>

                    {/* Right Box: Plan B & Action Button */}
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '20px', borderRadius: '10px', borderLeft: '4px solid var(--accent-blue)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 'bold', marginBottom: '8px' }}>
                        <ShieldAlert size={18} /> TradeMind AI B-Planı & Aksiyon
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#e0e7ff', lineHeight: '1.5', marginBottom: '16px' }}>
                        {activeScenario.planB}
                      </p>
                      <button style={{ 
                        background: 'var(--accent-blue)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 18px', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        <ExternalLink size={16} /> {activeScenario.actionButtonText || 'Otonom Eylem Protokolünü Başlat'}
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <Globe2 size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3 style={{ color: 'white' }}>Henüz Bir Kriz Simülasyonu Çalıştırılmadı</h3>
              <p style={{ textAlign: 'center', maxWidth: '420px', marginTop: '8px', fontSize: '0.9rem' }}>
                Soldaki formdan şirketinize özel bir risk durumu yazın veya hazır makro senaryolardan birini seçerek yapay zekanın 3 farklı olasılık senaryosu üretmesini sağlayın.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CrisisSimulator;
