import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Brain, RefreshCw, AlertTriangle,
  Zap, X, BarChart2, ChevronRight, ChevronDown, ExternalLink, Clock,
  Newspaper, Wallet, Database, Globe, Filter, Star, ArrowUpRight,
  ArrowDownRight, Shield, Target, Calendar, Flame, Eye, Bitcoin,
  DollarSign, BarChart, LineChart, Maximize2, Info
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => (n == null ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtB = n => n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(2)}M`;
const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const seeded = (seed, min, max) => { const x = Math.sin(seed) * 10000; return min + (x - Math.floor(x)) * (max - min); };

// ─── Static Simulated Data ─────────────────────────────────────────────────
const NEWS_DATA = [
  { id: 1, headline: "Federal Reserve signals potential rate pause as inflation data cools", source: "Bloomberg", time: "2 min ago", summary: "The Fed indicated a possible pause in rate hikes following softer CPI readings, boosting risk asset sentiment across equities and crypto markets.", impact: "Bullish", importance: 5, full: "Fed Chair Powell noted that while inflation remains above target, the trajectory suggests moderation. Markets reacted positively with BTC surging 3.2% on the news. Risk assets broadly rallied as the dollar weakened against major currencies. The FOMC meeting minutes revealed internal debate about the pace of future hikes." },
  { id: 2, headline: "BlackRock Bitcoin ETF records $312M daily inflow — largest since launch", source: "CoinDesk", time: "8 min ago", summary: "Institutional demand for spot Bitcoin ETFs accelerates as BlackRock's IBIT fund registers record single-day inflows, signaling growing mainstream adoption.", impact: "Bullish", importance: 5, full: "BlackRock's iShares Bitcoin Trust (IBIT) recorded $312 million in net inflows on Tuesday, the highest since its January 2024 launch. Total AUM across spot Bitcoin ETFs now exceeds $58 billion. Analysts attribute the surge to pension funds and RIAs increasing allocation to digital assets following regulatory clarity." },
  { id: 3, headline: "China CBDC pilot expands to 26 cities — crypto markets react cautiously", source: "Reuters", time: "22 min ago", summary: "China's digital yuan pilot broadens scope amid geopolitical tensions. Market participants assess long-term implications for stablecoin competition.", impact: "Neutral", importance: 3, full: "The People's Bank of China announced an expansion of its e-CNY digital currency pilot to 26 major cities, covering a population of over 400 million. Analysts note that while this poses competition to stablecoins in Asian markets, it is unlikely to affect USD-denominated crypto markets directly in the near term." },
  { id: 4, headline: "Ethereum staking yield surges to 5.8% amid DeFi activity spike", source: "The Block", time: "35 min ago", summary: "Network activity on Ethereum hits 6-month highs as DeFi protocols see record TVL. Staking yields rise as validator demand increases.", impact: "Bullish", importance: 4, full: "Ethereum's annualized staking yield climbed to 5.8%, outperforming many traditional fixed-income instruments. DeFi total value locked (TVL) reached $89 billion, the highest since December 2021. The surge is driven by new yield strategies in restaking protocols and increased DEX trading volumes." },
  { id: 5, headline: "SEC delays decision on Solana ETF applications from 5 firms", source: "WSJ", time: "1 hr ago", summary: "Regulatory uncertainty continues for altcoin ETFs as SEC extends review period. SOL drops 4.2% on the announcement before partial recovery.", impact: "Bearish", importance: 4, full: "The U.S. Securities and Exchange Commission has delayed its decision on Solana ETF applications from VanEck, Bitwise, 21Shares, Canary Capital, and Franklin Templeton by 45 days. The delay extends the review period to Q3 2025. SOL initially fell 4.2% before recovering half the losses as traders anticipated eventual approval." },
  { id: 6, headline: "Tether mints $1.2B USDT as stablecoin demand rises ahead of earnings season", source: "Kaiko", time: "2 hr ago", summary: "Large USDT minting event signals institutional dry powder building. Historically a precursor to significant market moves within 2–5 days.", impact: "Bullish", importance: 3, full: "Tether minted $1.2 billion worth of USDT tokens, the second-largest single minting in 2025. On-chain analysts note that large minting events have historically preceded significant Bitcoin price appreciation within a 2–5 day window. The minting coincides with increased activity from known institutional wallet clusters." },
];

const WHALE_ALERTS = [
  { id: 1, size: '🐋 Mega Whale', amount: '2,450 BTC', amountUsd: '$159.3M', exchange: 'Binance', time: '1 min ago', signal: 'Buy', color: '#10b981', walletAge: '4.2 years', interpretation: 'Large accumulation detected. Wallet history suggests long-term holder pattern. Historically bullish within 24–72 hours.' },
  { id: 2, size: '🐳 Large Whale', amount: '18,200 ETH', amountUsd: '$35.4M', exchange: 'Coinbase Pro', time: '4 min ago', signal: 'Sell', color: '#ef4444', walletAge: '2.1 years', interpretation: 'Exchange inflow detected. Large ETH transfer to Coinbase custody — potential OTC desk activity or staged selling.' },
  { id: 3, size: '🦈 Shark', amount: '1,200,000 XRP', amountUsd: '$1.32M', exchange: 'Kraken', time: '11 min ago', signal: 'Neutral', color: '#f59e0b', walletAge: '0.8 years', interpretation: 'Midsize transfer with mixed on-chain context. Await confirmation of trend direction before acting.' },
  { id: 4, size: '🐋 Mega Whale', amount: '890 BTC', amountUsd: '$57.9M', exchange: 'Cold Wallet', time: '18 min ago', signal: 'Buy', color: '#10b981', walletAge: '6.7 years', interpretation: 'Self-custody withdrawal from exchange — strong signal of long-term accumulation by a seasoned holder.' },
  { id: 5, size: '🐳 Large Whale', amount: '45,000 SOL', amountUsd: '$3.4M', exchange: 'OKX', time: '25 min ago', signal: 'Sell', color: '#ef4444', walletAge: '1.3 years', interpretation: 'SOL moved to OKX exchange wallet. Possible upcoming sell pressure in $3–5M range.' },
];

const ONCHAIN_METRICS = [
  { label: 'Exchange Reserves', value: '2.31M BTC', delta: -2.4, trend: 'down', color: '#10b981', icon: Database, desc: 'Declining reserves = bullish' },
  { label: 'Active Wallets', value: '1.24M', delta: +8.7, trend: 'up', color: '#6366f1', icon: Wallet, desc: '30-day active addresses' },
  { label: 'Transaction Count', value: '892K/day', delta: +3.2, trend: 'up', color: '#06b6d4', icon: Activity, desc: 'Daily on-chain transactions' },
  { label: 'Stablecoin Supply', value: '$158.4B', delta: +5.1, trend: 'up', color: '#f59e0b', icon: DollarSign, desc: 'Total USDT + USDC + BUSD' },
  { label: 'Miner Activity', value: '94.2%', delta: +1.3, trend: 'up', color: '#8b5cf6', icon: Zap, desc: 'Hash rate utilization' },
  { label: 'Large Holder Ratio', value: '67.8%', delta: +0.9, trend: 'up', color: '#ec4899', icon: Target, desc: 'Supply held by top 1K wallets' },
  { label: 'Network Activity', value: 'Very High', delta: null, trend: 'up', color: '#10b981', icon: Globe, desc: 'Composite network score' },
  { label: 'Realized Cap', value: '$483.2B', delta: +2.8, trend: 'up', color: '#14b8a6', icon: BarChart, desc: 'Market cap at last move price' },
];

const CALENDAR_EVENTS = [
  { event: 'FOMC Meeting Minutes', category: 'FED', date: 'Aug 21, 2025', time: '14:00 EST', importance: 'High', impact: 'Moderate volatility expected. BTC -5% to +8% historical range.', daysLeft: 16 },
  { event: 'U.S. CPI Release (Jul)', category: 'CPI', date: 'Aug 13, 2025', time: '08:30 EST', importance: 'High', impact: 'Core inflation beat/miss drives $10K+ BTC swings. Key catalyst.', daysLeft: 8 },
  { event: 'ECB Interest Rate Decision', category: 'ECB', date: 'Sep 4, 2025', time: '13:15 CET', importance: 'High', impact: 'EUR/USD move affects crypto sentiment globally.', daysLeft: 30 },
  { event: 'U.S. PPI Release (Jul)', category: 'PPI', date: 'Aug 14, 2025', time: '08:30 EST', importance: 'Medium', impact: 'Secondary inflation gauge. Markets may react if CPI diverges.', daysLeft: 9 },
  { event: 'U.S. Non-Farm Payrolls', category: 'Employment', date: 'Sep 6, 2025', time: '08:30 EST', importance: 'High', impact: 'Strong jobs = dollar strength = crypto headwind.', daysLeft: 32 },
  { event: 'Bank of Japan Rate Decision', category: 'BoJ', date: 'Aug 29, 2025', time: '03:00 JST', importance: 'Medium', impact: 'Yen carry trade unwind risk. Watch USD/JPY correlation.', daysLeft: 24 },
  { event: 'U.S. GDP Q2 Final', category: 'GDP', date: 'Aug 28, 2025', time: '08:30 EST', importance: 'Medium', impact: 'Growth confirmation. Risk-on if above 2.5% QoQ annualized.', daysLeft: 23 },
  { event: 'Bank of England MPC Meeting', category: 'BoE', date: 'Aug 7, 2025', time: '12:00 BST', importance: 'Medium', impact: 'GBP volatility. Indirect effect on global risk sentiment.', daysLeft: 2 },
];

const ETF_DATA = [
  { name: 'Bitcoin ETF (IBIT)', ticker: 'BTC', daily: +312.4, weekly: +890.2, monthly: +2340.1, net: +8920.5, color: '#f59e0b', trend: 'up' },
  { name: 'Ethereum ETF (ETHA)', ticker: 'ETH', daily: +87.3, weekly: +210.6, monthly: +643.9, net: +1240.3, color: '#6366f1', trend: 'up' },
  { name: 'Fidelity BTC (FBTC)', ticker: 'BTC', daily: +145.7, weekly: +380.2, monthly: +1100.4, net: +4230.8, color: '#06b6d4', trend: 'up' },
  { name: 'Ark 21Shares (ARKB)', ticker: 'BTC', daily: -23.1, weekly: +45.3, monthly: +230.6, net: +870.2, color: '#8b5cf6', trend: 'mixed' },
];

const SR_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64920, strongSupport: 61200, weakSupport: 63100, strongResistance: 67500, weakResistance: 65800, breakoutProbability: 68, trendDirection: 'Bullish', recommendation: 'Hold long positions above $63,100. A close above $65,800 confirms breakout toward $67,500 target. Stop loss at $61,200.' },
  { symbol: 'ETH', name: 'Ethereum', price: 3420, strongSupport: 3180, weakSupport: 3300, strongResistance: 3680, weakResistance: 3520, breakoutProbability: 52, trendDirection: 'Neutral', recommendation: 'Consolidation phase between $3,300–$3,520. Wait for confirmation above $3,520 or accumulate near $3,300 support.' },
  { symbol: 'SOL', name: 'Solana', price: 185.4, strongSupport: 168.0, weakSupport: 178.5, strongResistance: 198.0, weakResistance: 191.0, breakoutProbability: 74, trendDirection: 'Strongly Bullish', recommendation: 'Strong momentum. High breakout probability above $191. Target $198–$215 range. Aggressive entries above $185 justified.' },
];

// ─── Mini Sparkline ────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#6366f1', height = 48, width = 120 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * height * 0.85 - height * 0.075
  ]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Semi-Circle Gauge ────────────────────────────────────────────────────
const FearGauge = ({ value }) => {
  const r = 80; const cx = 100; const cy = 100;
  const circumference = Math.PI * r;
  const clamp = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamp / 100);
  const getColor = v => v < 25 ? '#ef4444' : v < 45 ? '#f97316' : v < 55 ? '#eab308' : v < 75 ? '#84cc16' : '#10b981';
  const getLabel = v => v < 25 ? 'Extreme Fear' : v < 45 ? 'Fear' : v < 55 ? 'Neutral' : v < 75 ? 'Greed' : 'Extreme Greed';
  const color = getColor(clamp);
  const angle = -180 + (clamp / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.85 * Math.cos(rad);
  const needleY = cy + r * 0.85 * Math.sin(rad);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
        {/* Color zones */}
        {[
          { start: 0, end: 20, c: '#ef4444' },
          { start: 20, end: 40, c: '#f97316' },
          { start: 40, end: 60, c: '#eab308' },
          { start: 60, end: 80, c: '#84cc16' },
          { start: 80, end: 100, c: '#10b981' }
        ].map(z => {
          const sa = -Math.PI + (z.start / 100) * Math.PI;
          const ea = -Math.PI + (z.end / 100) * Math.PI;
          const x1 = cx + r * Math.cos(sa); const y1 = cy + r * Math.sin(sa);
          const x2 = cx + r * Math.cos(ea); const y2 = cy + r * Math.sin(ea);
          return <path key={z.start} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={z.c} strokeWidth="14" strokeLinecap="butt" opacity="0.35" />;
        })}
        {/* Active arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference * (clamp / 100)} ${circumference}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        {/* Value */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{clamp}</text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" fontWeight="600">{getLabel(clamp)}</text>
      </svg>
    </div>
  );
};

// ─── Circular Progress ────────────────────────────────────────────────────
const CircularScore = ({ score, size = 52, color = '#6366f1' }) => {
  const r = (size - 6) / 2; const c = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={fill} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.28} fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${c}px ${c}px` }}>{score}</text>
    </svg>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 20, r = 6 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
);

// ─── CHART COMPONENT ──────────────────────────────────────────────────────
const AdvancedChart = ({ data, symbol }) => {
  const [tf, setTf] = useState('1D');
  const [indicator, setIndicator] = useState('RSI');
  const tfs = ['15M', '1H', '4H', '1D', '1W', '1M'];
  const indicators = ['RSI', 'MACD', 'BB', 'Volume'];

  const h = 260;
  const w = 700;
  const prices = data || Array.from({ length: 60 }, (_, i) => 64000 + Math.sin(i * 0.3) * 3000 + seeded(i * 7 + 1, -2000, 2000));
  const min = Math.min(...prices) * 0.998;
  const max = Math.max(...prices) * 1.002;
  const range = max - min;
  const pts = prices.map((v, i) => [(i / (prices.length - 1)) * w, h - ((v - min) / range) * h * 0.9 - h * 0.05]);
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {tfs.map(t => (
            <button key={t} onClick={() => setTf(t)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', borderColor: tf === t ? '#6366f1' : 'rgba(255,255,255,0.1)', background: tf === t ? 'rgba(99,102,241,0.2)' : 'transparent', color: tf === t ? '#818cf8' : 'var(--text-muted)' }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {indicators.map(ind => (
            <button key={ind} onClick={() => setIndicator(ind)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', borderColor: indicator === ind ? '#10b981' : 'rgba(255,255,255,0.1)', background: indicator === ind ? 'rgba(16,185,129,0.15)' : 'transparent', color: indicator === ind ? '#34d399' : 'var(--text-muted)' }}>{ind}</button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(frac => (
            <line key={frac} x1="0" y1={h * frac} x2={w} y2={h * frac} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          <path d={areaPath} fill="url(#chartGrad)" />
          <path d={linePath} stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Current price line */}
          <line x1="0" y1={pts[pts.length - 1][1]} x2={w} y2={pts[pts.length - 1][1]} stroke="#10b981" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
        </svg>
        <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>{symbol}/USD · {tf}</span>
          <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>● LIVE</span>
        </div>
      </div>
      {/* Indicator sub-chart */}
      <div style={{ marginTop: '8px', height: '60px', borderRadius: '8px', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '12px', fontWeight: '600' }}>{indicator}</span>
        <svg width="100%" height="44" style={{ flex: 1 }}>
          {indicator === 'RSI' && (
            <>
              <line x1="0" y1="14" x2="700" y2="14" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0" y1="36" x2="700" y2="36" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="3,3" />
              <polyline points={Array.from({ length: 60 }, (_, i) => `${(i / 59) * 100}%,${22 + Math.sin(i * 0.25) * 12}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            </>
          )}
          {indicator === 'MACD' && (
            <>
              {Array.from({ length: 60 }, (_, i) => {
                const v = Math.sin(i * 0.3) * 10;
                const x = (i / 59) * 700;
                return <rect key={i} x={x - 4} y={v < 0 ? 22 : 22 + v} width="6" height={Math.abs(v)} fill={v > 0 ? '#10b981' : '#ef4444'} opacity="0.7" />;
              })}
            </>
          )}
          {indicator === 'Volume' && (
            <>
              {Array.from({ length: 40 }, (_, i) => {
                const v = seeded(i * 3, 5, 35);
                return <rect key={i} x={(i / 39) * 700} y={44 - v} width="14" height={v} fill="rgba(99,102,241,0.5)" rx="2" />;
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const Dashboard = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(now());
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [expandedNews, setExpandedNews] = useState(null);
  const [heatFilter, setHeatFilter] = useState('24H');
  const [fearValue] = useState(62);
  const [activeTab, setActiveTab] = useState('chart');
  const [chartAsset, setChartAsset] = useState('BTC');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sparkline price history (30 candles simulated)
  const sparkData = {
    BTC: Array.from({ length: 30 }, (_, i) => 62000 + Math.sin(i * 0.4) * 4000 + seeded(i * 13, -1500, 1500)),
    ETH: Array.from({ length: 30 }, (_, i) => 3300 + Math.sin(i * 0.35) * 300 + seeded(i * 17, -200, 200)),
    SOL: Array.from({ length: 30 }, (_, i) => 178 + Math.sin(i * 0.45) * 20 + seeded(i * 11, -15, 15)),
    BNB: Array.from({ length: 30 }, (_, i) => 570 + Math.sin(i * 0.3) * 30 + seeded(i * 19, -20, 20)),
    XRP: Array.from({ length: 30 }, (_, i) => 1.05 + Math.sin(i * 0.5) * 0.1 + seeded(i * 7, -0.08, 0.08)),
    ADA: Array.from({ length: 30 }, (_, i) => 0.45 + Math.sin(i * 0.4) * 0.04 + seeded(i * 9, -0.02, 0.02)),
    DOGE: Array.from({ length: 30 }, (_, i) => 0.14 + Math.sin(i * 0.6) * 0.02 + seeded(i * 5, -0.01, 0.01)),
    AVAX: Array.from({ length: 30 }, (_, i) => 38 + Math.sin(i * 0.4) * 4 + seeded(i * 15, -3, 3)),
  };

  const fetchCryptoData = useCallback(async () => {
    setIsRefreshing(true);
    const symbolsMap = [
      { ticker: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin', mcap: 1.28e12 },
      { ticker: 'ETH-USD', symbol: 'ETH', name: 'Ethereum', mcap: 4.1e11 },
      { ticker: 'SOL-USD', symbol: 'SOL', name: 'Solana', mcap: 8.5e10 },
      { ticker: 'BNB-USD', symbol: 'BNB', name: 'BNB', mcap: 8.3e10 },
      { ticker: 'XRP-USD', symbol: 'XRP', name: 'Ripple', mcap: 5.9e10 },
      { ticker: 'ADA-USD', symbol: 'ADA', name: 'Cardano', mcap: 1.7e10 },
      { ticker: 'DOGE-USD', symbol: 'DOGE', name: 'Dogecoin', mcap: 2.0e10 },
      { ticker: 'AVAX-USD', symbol: 'AVAX', name: 'Avalanche', mcap: 1.6e10 },
    ];
    try {
      const results = await Promise.all(symbolsMap.map(async item => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${item.ticker}?interval=1d&range=1mo`;
          const r = await fetch(url);
          if (!r.ok) throw new Error('HTTP error');
          const data = await r.json();
          const result = data.chart.result[0];
          const meta = result.meta;
          const price = meta.regularMarketPrice || 0;
          const prevClose = meta.chartPreviousClose || price;
          const change24h = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
          const closes = (result.indicators?.quote[0]?.close || []).filter(c => c !== null);
          const rsi = calcRSI(closes, price);
          const aiScore = Math.min(99, Math.max(1, Math.round(50 + (50 - rsi) * 0.6 + change24h * 1.5)));
          return {
            symbol: item.symbol, name: item.name, price,
            change24h, volume: meta.regularMarketVolume || 1e8,
            marketCap: item.mcap,
            high24h: meta.regularMarketDayHigh || price * 1.02,
            low24h: meta.regularMarketDayLow || price * 0.98,
            rsi: Math.round(rsi * 10) / 10,
            trend: rsi < 40 ? 'Bullish' : rsi > 65 ? 'Bearish' : 'Neutral',
            support: price * 0.953,
            resistance: price * 1.041,
            aiScore,
            signal: aiScore > 65 ? 'BUY' : aiScore < 35 ? 'SELL' : 'HOLD',
          };
        } catch {
          return mockAsset(item);
        }
      }));
      setCryptoData(results);
    } catch {
      setCryptoData(symbolsMap.map(item => mockAsset(item)));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdate(now());
    }
  }, []);

  const calcRSI = (closes, cur) => {
    if (!closes || closes.length < 5) return 50;
    const recent = [...closes.slice(-14), cur];
    let g = 0, l = 0;
    for (let i = 1; i < recent.length; i++) { const d = recent[i] - recent[i - 1]; if (d > 0) g += d; else l += Math.abs(d); }
    if (l === 0) return 100;
    return 100 - 100 / (1 + g / l);
  };

  const mockAsset = (item) => ({
    symbol: item.symbol, name: item.name,
    price: seeded(item.ticker.charCodeAt(0) * 17, 0.1, 70000),
    change24h: seeded(item.ticker.charCodeAt(0) * 13, -8, 12),
    volume: seeded(item.ticker.charCodeAt(0) * 7, 5e7, 5e9),
    marketCap: item.mcap, rsi: seeded(item.ticker.charCodeAt(0) * 3, 35, 70),
    trend: 'Neutral', support: 0, resistance: 0, aiScore: 55, signal: 'HOLD',
    high24h: 0, low24h: 0,
  });

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(() => { fetchCryptoData(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const signalStyle = s => ({
    BUY: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' },
    SELL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    HOLD: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
  }[s] || { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' });

  const importanceColor = imp => ({ High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[imp] || '#9ca3af');
  const impactBadge = i => ({ Bullish: { bg: 'rgba(16,185,129,0.15)', c: '#10b981' }, Bearish: { bg: 'rgba(239,68,68,0.15)', c: '#ef4444' }, Neutral: { bg: 'rgba(245,158,11,0.1)', c: '#f59e0b' } }[i] || { bg: '', c: '' });

  const heatAssets = [
    { sym: 'BTC', '24H': 3.2, '7D': 8.1, '30D': 22.4 },
    { sym: 'ETH', '24H': 5.7, '7D': 12.3, '30D': 18.9 },
    { sym: 'SOL', '24H': -2.1, '7D': 15.4, '30D': 42.1 },
    { sym: 'BNB', '24H': 1.4, '7D': 3.2, '30D': 7.8 },
    { sym: 'XRP', '24H': -4.3, '7D': -1.2, '30D': 11.3 },
    { sym: 'ADA', '24H': 0.8, '7D': -5.2, '30D': -3.1 },
    { sym: 'DOGE', '24H': 7.2, '7D': 18.6, '30D': 35.2 },
    { sym: 'AVAX', '24H': -1.8, '7D': 4.7, '30D': 14.8 },
    { sym: 'LINK', '24H': 2.9, '7D': 7.3, '30D': 28.1 },
    { sym: 'DOT', '24H': -3.2, '7D': -8.1, '30D': -12.4 },
    { sym: 'MATIC', '24H': 4.1, '7D': 9.2, '30D': 21.3 },
    { sym: 'UNI', '24H': -0.9, '7D': 2.4, '30D': 8.7 },
    { sym: 'ATOM', '24H': -5.4, '7D': -12.3, '30D': -18.2 },
    { sym: 'LTC', '24H': 1.2, '7D': 3.8, '30D': 6.4 },
    { sym: 'NEAR', '24H': 8.4, '7D': 22.1, '30D': 47.3 },
  ];

  const heatColor = v => {
    if (v > 15) return { bg: '#065f46', t: '#34d399' };
    if (v > 8) return { bg: '#064e3b', t: '#10b981' };
    if (v > 3) return { bg: '#052e16', t: '#4ade80' };
    if (v > 0) return { bg: '#022c22', t: '#86efac' };
    if (v > -3) return { bg: '#2d1515', t: '#fca5a5' };
    if (v > -8) return { bg: '#450a0a', t: '#f87171' };
    return { bg: '#7f1d1d', t: '#ef4444' };
  };

  const gainers = [...cryptoData].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const losers = [...cryptoData].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const chartData = sparkData[chartAsset] || sparkData.BTC;

  const section = (title, icon, extra, children) => (
    <div className="fid-section">
      <div className="fid-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'white' }}>{title}</span>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );

  return (
    <div className="fid-root">
      {/* ── MARKET PULSE BAR ───────────────────────────────────────────── */}
      <div className="market-pulse-bar">
        <div className="pulse-item">
          <span className="pulse-label">AI Sentiment</span>
          <span className="pulse-badge bullish">🟢 Bullish</span>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item">
          <span className="pulse-label">Market Strength</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ width: '72%', height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg,#6366f1,#06b6d4)' }} />
            </div>
            <span style={{ color: '#818cf8', fontWeight: '700', fontSize: '0.85rem' }}>72/100</span>
          </div>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item">
          <span className="pulse-label">Fear & Greed</span>
          <span className="pulse-badge greed">😏 Greed · 62</span>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item">
          <span className="pulse-label">Whale Activity</span>
          <span className="pulse-badge high-activity">🐋 High</span>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item">
          <span className="pulse-label">ETF Flow</span>
          <span className="pulse-badge inflow">🏦 Net Inflow +$545M</span>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item">
          <span className="pulse-label">News Sentiment</span>
          <span className="pulse-badge bullish">📰 Positive</span>
        </div>
        <div className="pulse-divider" />
        <div className="pulse-item" style={{ gap: '6px' }}>
          <div className="live-dot" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Updated {lastUpdate}</span>
          <button onClick={() => fetchCryptoData()} disabled={isRefreshing} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0', display: 'flex' }}>
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div className="fid-content">

        {/* ── ASSET CARDS ──────────────────────────────────────────────── */}
        {section('Market Overview — Live Asset Cards', <BarChart2 size={18} color="#6366f1" />,
          <span className="fid-live-badge">● LIVE</span>,
          <div className="asset-cards-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="asset-card fid-glass" style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
                    <Skeleton h={16} w="60%" />
                    <Skeleton h={32} w="80%" />
                    <Skeleton h={48} />
                    <Skeleton h={14} w="50%" />
                  </div>
                ))
              : cryptoData.map(asset => {
                  const s = signalStyle(asset.signal);
                  const spark = sparkData[asset.symbol] || sparkData.BTC;
                  const isUp = asset.change24h >= 0;
                  return (
                    <div key={asset.symbol} className="asset-card fid-glass fid-hover" onClick={() => setSelectedAsset(asset)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="coin-avatar" style={{ background: isUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isUp ? '#10b981' : '#ef4444' }}>
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>{asset.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.symbol}/USD</div>
                          </div>
                        </div>
                        <span style={{ ...s, background: s.bg, padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{asset.signal}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '1.55rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>
                            ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            {isUp ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
                            <span style={{ color: isUp ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>
                              {isUp ? '+' : ''}{asset.change24h?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <Sparkline data={spark} color={isUp ? '#10b981' : '#ef4444'} />
                      </div>

                      <div className="asset-meta-grid">
                        <div className="asset-meta-item">
                          <span className="meta-label">Market Cap</span>
                          <span className="meta-val">{fmtB(asset.marketCap)}</span>
                        </div>
                        <div className="asset-meta-item">
                          <span className="meta-label">24H Volume</span>
                          <span className="meta-val">{fmtB(asset.volume)}</span>
                        </div>
                        <div className="asset-meta-item">
                          <span className="meta-label">Support</span>
                          <span className="meta-val" style={{ color: '#10b981' }}>${asset.support > 0 ? asset.support.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                        </div>
                        <div className="asset-meta-item">
                          <span className="meta-label">Resistance</span>
                          <span className="meta-val" style={{ color: '#ef4444' }}>${asset.resistance > 0 ? asset.resistance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.72rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>RSI({asset.rsi})</span>
                          <span style={{ color: asset.rsi < 35 ? '#10b981' : asset.rsi > 65 ? '#ef4444' : '#f59e0b' }}>{asset.trend}</span>
                        </div>
                        <div className="rsi-bar">
                          <div className="rsi-fill" style={{ width: `${asset.rsi}%`, background: asset.rsi < 35 ? '#10b981' : asset.rsi > 65 ? '#ef4444' : '#f59e0b' }} />
                          <div className="rsi-marker" style={{ left: '35%' }} />
                          <div className="rsi-marker" style={{ left: '65%' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CircularScore score={asset.aiScore} size={44} color={asset.aiScore > 65 ? '#10b981' : asset.aiScore < 35 ? '#ef4444' : '#f59e0b'} />
                          <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'white' }}>{asset.aiScore >= 70 ? 'High' : asset.aiScore >= 40 ? 'Medium' : 'Low'}</div>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelectedAsset(asset); }}
                          className="ai-analyze-btn">
                          <Brain size={13} /> AI Analyze
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── CHART + FEAR & GREED ─────────────────────────────────────── */}
        <div className="fid-two-col" style={{ '--ratio': '2fr 1fr' }}>
          {section('Advanced Chart', <LineChart size={18} color="#818cf8" />,
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.keys(sparkData).slice(0, 5).map(s => (
                <button key={s} onClick={() => setChartAsset(s)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid', fontSize: '0.72rem', cursor: 'pointer', borderColor: chartAsset === s ? '#6366f1' : 'rgba(255,255,255,0.1)', background: chartAsset === s ? 'rgba(99,102,241,0.2)' : 'transparent', color: chartAsset === s ? '#818cf8' : 'var(--text-muted)' }}>{s}</button>
              ))}
            </div>,
            <div className="fid-glass" style={{ borderRadius: '12px', padding: '20px' }}>
              <AdvancedChart data={chartData} symbol={chartAsset} />
            </div>
          )}

          {section('Fear & Greed Index', <Activity size={18} color="#f59e0b" />, null,
            <div className="fid-glass" style={{ borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FearGauge value={fearValue} />
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>7-Day Historical</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px' }}>
                  {[48, 52, 59, 55, 61, 64, 62].map((v, i) => {
                    const c = v < 50 ? '#f97316' : v < 65 ? '#eab308' : '#10b981';
                    return <div key={i} style={{ flex: 1, height: `${(v / 100) * 40}px`, borderRadius: '2px 2px 0 0', background: c, opacity: 0.7 }} title={`${v}`} />;
                  })}
                </div>
              </div>
              <div className="fid-ai-note">
                <Brain size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                <p>Market sentiment sits in <strong style={{ color: '#10b981' }}>Greed</strong> territory. Historical data suggests moderate correction risk within 2–3 weeks when sustained above 60. However, institutional inflows from ETFs provide a structural floor. Recommended: partial profit-taking on 15–20% of long positions.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── AI NEWS ANALYSIS ─────────────────────────────────────────── */}
        {section('AI News Analysis', <Newspaper size={18} color="#06b6d4" />,
          <div className="fid-live-badge" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', borderColor: 'rgba(6,182,212,0.3)' }}>6 stories</div>,
          <div className="news-grid">
            {NEWS_DATA.map(news => {
              const imp = impactBadge(news.impact);
              const isExpanded = expandedNews === news.id;
              return (
                <div key={news.id} className="news-card fid-glass fid-hover" onClick={() => setExpandedNews(isExpanded ? null : news.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#06b6d4', fontWeight: '600' }}>{news.source}</span>
                      <span>·</span><Clock size={11} /><span>{news.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} fill={i < news.importance ? '#f59e0b' : 'transparent'} color={i < news.importance ? '#f59e0b' : 'rgba(255,255,255,0.15)'} />
                      ))}
                    </div>
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '8px' }}>{news.headline}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '10px' }}>{news.summary}</p>
                  {isExpanded && (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '10px', fontSize: '0.82rem', color: '#d1d5db', lineHeight: '1.6', borderLeft: '3px solid #6366f1' }}>
                      <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '600', marginBottom: '6px' }}>🤖 Full AI Analysis</div>
                      {news.full}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: imp.bg, color: imp.c, padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>
                      {news.impact === 'Bullish' ? '↑' : news.impact === 'Bearish' ? '↓' : '→'} {news.impact}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}>
                      {isExpanded ? 'Collapse' : 'Full Analysis'} <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ETF FLOW + WHALE ALERTS ──────────────────────────────────── */}
        <div className="fid-two-col" style={{ '--ratio': '1fr 1fr' }}>
          {section('ETF Flow Dashboard', <DollarSign size={18} color="#10b981" />,
            <span className="pulse-badge inflow" style={{ fontSize: '0.72rem' }}>Net Inflow +$545M Today</span>,
            <div className="fid-glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="etf-table-header">
                <span>Fund</span><span>Daily</span><span>Weekly</span><span>Monthly</span><span>Net AUM</span>
              </div>
              {ETF_DATA.map(etf => (
                <div key={etf.name} className="etf-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${etf.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: etf.color, fontSize: '0.72rem', fontWeight: '700' }}>{etf.ticker}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{etf.name}</div>
                    </div>
                  </div>
                  {[etf.daily, etf.weekly, etf.monthly, etf.net].map((v, i) => (
                    <span key={i} style={{ color: v >= 0 ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>
                      {v >= 0 ? '+' : ''}${Math.abs(v).toFixed(1)}M
                    </span>
                  ))}
                </div>
              ))}
              <div className="fid-ai-note" style={{ margin: '12px', marginTop: '4px' }}>
                <Brain size={14} color="#10b981" style={{ flexShrink: 0 }} />
                <p>Cumulative ETF inflows remain strongly positive. BlackRock and Fidelity lead with $8.9B and $4.2B net AUM respectively. Institutional adoption accelerating — historically associated with sustained bull phases lasting 3–6 months.</p>
              </div>
            </div>
          )}

          {section('Whale Alert — Live Activity', <Eye size={18} color="#8b5cf6" />,
            <span className="pulse-badge high-activity" style={{ fontSize: '0.72rem' }}>🐋 5 alerts</span>,
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {WHALE_ALERTS.map(w => (
                <div key={w.id} className="whale-card fid-glass fid-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{w.size}</span>
                        <span style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>{w.amount}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>≈ {w.amountUsd}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                        <span>📍 {w.exchange}</span>
                        <span>🕐 {w.time}</span>
                        <span>🔑 Age: {w.walletAge}</span>
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: w.signal === 'Buy' ? 'rgba(16,185,129,0.15)' : w.signal === 'Sell' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: w.signal === 'Buy' ? '#10b981' : w.signal === 'Sell' ? '#ef4444' : '#f59e0b' }}>
                      {w.signal === 'Buy' ? '▲' : w.signal === 'Sell' ? '▼' : '●'} {w.signal}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: '1.4', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                    <span style={{ color: '#818cf8', fontWeight: '600' }}>AI: </span>{w.interpretation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ON-CHAIN ANALYTICS ───────────────────────────────────────── */}
        {section('On-Chain Analytics', <Database size={18} color="#06b6d4" />,
          <span className="fid-live-badge" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', borderColor: 'rgba(6,182,212,0.3)' }}>8 metrics</span>,
          <div>
            <div className="onchain-grid">
              {ONCHAIN_METRICS.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="onchain-card fid-glass fid-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={m.color} />
                      </div>
                      {m.delta !== null && (
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: m.delta > 0 ? '#10b981' : '#ef4444', background: m.delta > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: '20px' }}>
                          {m.delta > 0 ? '+' : ''}{m.delta}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'white', marginBottom: '2px' }}>{m.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.label}</div>
                    <div style={{ fontSize: '0.65rem', color: m.color, marginTop: '6px' }}>{m.desc}</div>
                  </div>
                );
              })}
            </div>
            <div className="fid-ai-note" style={{ marginTop: '12px' }}>
              <Brain size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
              <p>On-chain metrics paint a strongly bullish picture. Exchange reserves declining sharply while active wallet count and stablecoin supply surge — classic signs of capital rotation into crypto. Large holder ratio increasing suggests smart money accumulation. Network activity at 6-month highs confirms organic demand growth.</p>
            </div>
          </div>
        )}

        {/* ── SUPPORT & RESISTANCE ─────────────────────────────────────── */}
        {section('Support & Resistance Analysis', <Target size={18} color="#ec4899" />, null,
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SR_ASSETS.map(a => {
              const range = a.strongResistance - a.strongSupport;
              const position = ((a.price - a.strongSupport) / range) * 100;
              const trendColor = a.trendDirection.includes('Bullish') ? '#10b981' : a.trendDirection.includes('Bearish') ? '#ef4444' : '#f59e0b';
              return (
                <div key={a.symbol} className="sr-card fid-glass">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="coin-avatar" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899', width: '38px', height: '38px' }}>{a.symbol}</div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'white' }}>{a.name}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>
                          ${a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: `${trendColor}18`, color: trendColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>{a.trendDirection}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Breakout Prob:</span>
                      <span style={{ color: '#818cf8', fontWeight: '700' }}>{a.breakoutProbability}%</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span style={{ color: '#10b981' }}>Strong Support ${a.strongSupport.toLocaleString()}</span>
                      <span style={{ color: 'rgba(16,185,129,0.6)' }}>Weak ${a.weakSupport.toLocaleString()}</span>
                      <span style={{ color: 'rgba(239,68,68,0.6)' }}>Weak ${a.weakResistance.toLocaleString()}</span>
                      <span style={{ color: '#ef4444' }}>Strong Resistance ${a.strongResistance.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '5px', background: 'linear-gradient(90deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1) 35%, rgba(245,158,11,0.2) 50%, rgba(239,68,68,0.1) 65%, rgba(239,68,68,0.3))', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: `${Math.min(95, Math.max(5, position))}%`, top: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', border: '3px solid #6366f1', transform: 'translateX(-50%)', boxShadow: '0 0 8px rgba(99,102,241,0.6)', transition: 'left 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Oversold Zone</span><span>Fair Value</span><span>Overbought Zone</span>
                    </div>
                  </div>

                  <div className="fid-ai-note">
                    <Brain size={13} color="#ec4899" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem' }}>{a.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HEAT MAP ─────────────────────────────────────────────────── */}
        {section('Crypto Heat Map', <Flame size={18} color="#f97316" />,
          <div style={{ display: 'flex', gap: '4px' }}>
            {['24H', '7D', '30D'].map(f => (
              <button key={f} onClick={() => setHeatFilter(f)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid', fontSize: '0.75rem', cursor: 'pointer', borderColor: heatFilter === f ? '#f97316' : 'rgba(255,255,255,0.1)', background: heatFilter === f ? 'rgba(249,115,22,0.15)' : 'transparent', color: heatFilter === f ? '#fb923c' : 'var(--text-muted)' }}>{f}</button>
            ))}
          </div>,
          <div>
            <div className="heat-map-grid">
              {heatAssets.map(a => {
                const val = a[heatFilter];
                const { bg, t } = heatColor(val);
                return (
                  <div key={a.sym} className="heat-cell" style={{ background: bg, borderColor: `${t}22` }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: t }}>{a.sym}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: t }}>{val > 0 ? '+' : ''}{val.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
            <div className="fid-ai-note" style={{ marginTop: '12px' }}>
              <Brain size={14} color="#f97316" style={{ flexShrink: 0 }} />
              <p>
                {heatFilter === '24H' ? 'DOGE leads 24H gains at +7.2% on social media momentum. XRP and ADA face selling pressure. Overall market breadth: 10 of 15 assets positive — bullish signal.' : heatFilter === '7D' ? 'NEAR Protocol (+22.1%) and SOL (+15.4%) dominate weekly performance. DOT and ADA show relative weakness. DeFi rotation appears underway.' : 'NEAR (+47.3%), SOL (+42.1%), and DOGE (+35.2%) lead 30-day performance. ATOM is the sole major loser at -18.2%, reflecting validator ecosystem challenges.'}
              </p>
            </div>
          </div>
        )}

        {/* ── GAINERS + LOSERS ─────────────────────────────────────────── */}
        <div className="fid-two-col" style={{ '--ratio': '1fr 1fr' }}>
          {section('Top Gainers', <TrendingUp size={18} color="#10b981" />, null,
            <div className="fid-glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="gl-header"><span>Asset</span><span>Price</span><span>24H</span><span>7D</span><span>Momentum</span></div>
              {gainers.map((a, i) => (
                <div key={a.symbol} className="gl-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', width: '16px' }}>#{i + 1}</span>
                    <div className="coin-avatar" style={{ width: '30px', height: '30px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem' }}>{a.symbol.slice(0, 3)}</div>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>{a.symbol}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>${a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>+{a.change24h?.toFixed(2)}%</span>
                  <span style={{ color: '#34d399', fontSize: '0.78rem' }}>+{(a.change24h * 1.4).toFixed(1)}%</span>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700' }}>
                    {a.aiScore >= 70 ? '🔥 Strong' : a.aiScore >= 55 ? '📈 Good' : '📊 Moderate'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {section('Top Losers', <TrendingDown size={18} color="#ef4444" />, null,
            <div className="fid-glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="gl-header"><span>Asset</span><span>Price</span><span>24H</span><span>7D</span><span>Recovery</span></div>
              {losers.map((a, i) => (
                <div key={a.symbol} className="gl-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', width: '16px' }}>#{i + 1}</span>
                    <div className="coin-avatar" style={{ width: '30px', height: '30px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.65rem' }}>{a.symbol.slice(0, 3)}</div>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>{a.symbol}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>${a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>{a.change24h?.toFixed(2)}%</span>
                  <span style={{ color: '#f87171', fontSize: '0.78rem' }}>{(a.change24h * 1.6).toFixed(1)}%</span>
                  <span style={{ background: a.aiScore > 50 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: a.aiScore > 50 ? '#10b981' : '#ef4444', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700' }}>
                    {a.aiScore > 60 ? '⬆ High' : a.aiScore > 45 ? '➡ Medium' : '⬇ Low'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ECONOMIC CALENDAR ─────────────────────────────────────────── */}
        {section('Macro Economic Calendar', <Calendar size={18} color="#f59e0b" />,
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CALENDAR_EVENTS.length} upcoming events</span>,
          <div className="fid-glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="cal-header">
              <span>Event</span><span>Date / Time</span><span>Category</span><span>Importance</span><span>Countdown</span><span>Expected Impact</span>
            </div>
            {CALENDAR_EVENTS.map((ev, i) => (
              <div key={i} className="cal-row" style={{ borderLeft: `3px solid ${importanceColor(ev.importance)}` }}>
                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{ev.event}</span>
                <div style={{ fontSize: '0.78rem' }}>
                  <div style={{ color: 'white', fontWeight: '600' }}>{ev.date}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{ev.time}</div>
                </div>
                <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600' }}>{ev.category}</span>
                <span style={{ color: importanceColor(ev.importance), background: `${importanceColor(ev.importance)}15`, padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{ev.importance}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} color="#f59e0b" />
                  <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.82rem' }}>{ev.daysLeft}d</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', lineHeight: '1.3' }}>{ev.impact}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── LIVE STATUS BAR ─────────────────────────────────────────────── */}
      <div className="live-status-bar">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="live-dot" /><span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>Yahoo Finance</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Connected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="live-dot" style={{ background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} /><span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: '600' }}>CoinGecko</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Connected</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={11} />Last Refresh: {lastUpdate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Activity size={11} />Auto-refresh: 30s
          </div>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
          <span>TradeMind AI v2.0</span>
          <span>·</span>
          <span style={{ color: '#10b981' }}>All systems operational</span>
        </div>
      </div>

      {/* ── AI ANALYZE MODAL ─────────────────────────────────────────────── */}
      {selectedAsset && (
        <div className="ai-modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="ai-modal fid-glass" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="coin-avatar" style={{ width: '48px', height: '48px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.8rem' }}>{selectedAsset.symbol}</div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>{selectedAsset.name} — AI Deep Analysis</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                    <span>Yahoo Finance Live</span><span>·</span><span>{lastUpdate}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
            </div>

            {/* Price Row */}
            <div className="ai-modal-price-row">
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Current Price</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>
                  ${selectedAsset.price < 1 ? selectedAsset.price.toFixed(4) : selectedAsset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>24H Change</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: selectedAsset.change24h >= 0 ? '#10b981' : '#ef4444' }}>
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Risk Score</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${100 - selectedAsset.aiScore}%`, height: '100%', borderRadius: '3px', background: selectedAsset.aiScore > 60 ? '#10b981' : '#ef4444' }} />
                  </div>
                  <span style={{ fontWeight: '700', color: selectedAsset.aiScore > 60 ? '#10b981' : '#ef4444' }}>{100 - selectedAsset.aiScore}/100</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CircularScore score={selectedAsset.aiScore} size={64} color={selectedAsset.aiScore > 65 ? '#10b981' : selectedAsset.aiScore < 35 ? '#ef4444' : '#f59e0b'} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                  <div style={{ fontWeight: '800', color: 'white', fontSize: '1rem' }}>{selectedAsset.aiScore}%</div>
                </div>
              </div>
            </div>

            {/* Technical Indicators Grid */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Indicators</div>
              <div className="modal-indicators-grid">
                {[
                  { label: 'RSI (14)', value: selectedAsset.rsi?.toFixed(1) || '—', status: selectedAsset.rsi < 35 ? 'Oversold' : selectedAsset.rsi > 65 ? 'Overbought' : 'Normal', color: selectedAsset.rsi < 35 ? '#10b981' : selectedAsset.rsi > 65 ? '#ef4444' : '#f59e0b' },
                  { label: 'MACD', value: '12.4', status: 'Bullish Cross', color: '#10b981' },
                  { label: 'EMA 20', value: `$${selectedAsset.price ? (selectedAsset.price * 0.97).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}`, status: 'Price Above', color: '#10b981' },
                  { label: 'EMA 50', value: `$${selectedAsset.price ? (selectedAsset.price * 0.94).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}`, status: 'Price Above', color: '#10b981' },
                  { label: 'EMA 200', value: `$${selectedAsset.price ? (selectedAsset.price * 0.88).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}`, status: 'Price Above', color: '#10b981' },
                  { label: 'Bollinger', value: 'Mid-Upper', status: 'Expanding', color: '#06b6d4' },
                ].map(ind => (
                  <div key={ind.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{ind.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginBottom: '2px' }}>{ind.value}</div>
                    <div style={{ fontSize: '0.68rem', color: ind.color, fontWeight: '600' }}>{ind.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bull / Bear Cases */}
            <div className="modal-cases-grid">
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>🐂 Bull Case</div>
                <ul style={{ fontSize: '0.8rem', color: '#d1fae5', lineHeight: '1.8', paddingLeft: '16px' }}>
                  <li>RSI recovering from oversold territory — bullish reversal signal</li>
                  <li>Price holding above all major EMAs (20/50/200)</li>
                  <li>Institutional ETF inflows accelerating</li>
                  <li>Whale accumulation detected in past 48 hours</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>🐻 Bear Case</div>
                <ul style={{ fontSize: '0.8rem', color: '#fee2e2', lineHeight: '1.8', paddingLeft: '16px' }}>
                  <li>Macro headwinds from potential Fed tightening</li>
                  <li>Resistance at ${selectedAsset.resistance > 0 ? selectedAsset.resistance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'key level'} — could trigger rejection</li>
                  <li>BTC dominance rising may sap altcoin momentum</li>
                  <li>Overbought conditions on weekly RSI</li>
                </ul>
              </div>
            </div>

            {/* Catalysts & Risks */}
            <div className="modal-cases-grid">
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#818cf8', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>⚡ Potential Catalysts</div>
                <ul style={{ fontSize: '0.8rem', color: '#e0e7ff', lineHeight: '1.8', paddingLeft: '16px' }}>
                  <li>Fed rate cut decision (next FOMC meeting)</li>
                  <li>Halving cycle tailwinds (historically bullish 12–18 months)</li>
                  <li>Spot ETF inflow acceleration</li>
                  <li>Corporate treasury adoption news</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>⚠ Potential Risks</div>
                <ul style={{ fontSize: '0.8rem', color: '#fef3c7', lineHeight: '1.8', paddingLeft: '16px' }}>
                  <li>Regulatory crackdown in key jurisdictions</li>
                  <li>Macro recession risk affecting risk assets</li>
                  <li>Stablecoin depegging event (systemic risk)</li>
                  <li>Large exchange hack or security breach</li>
                </ul>
              </div>
            </div>

            {/* AI Commentary */}
            <div className="fid-ai-note" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)' }}>
              <Brain size={16} color="#818cf8" style={{ flexShrink: 0 }} />
              <p>
                <strong style={{ color: '#818cf8' }}>TradeMind AI Commentary: </strong>
                {selectedAsset.name} shows a {selectedAsset.aiScore >= 65 ? 'strongly bullish' : selectedAsset.aiScore >= 45 ? 'cautiously neutral' : 'bearish'} technical setup
                with RSI at {selectedAsset.rsi?.toFixed(1)}, indicating {selectedAsset.rsi < 40 ? 'potential oversold bounce' : selectedAsset.rsi > 65 ? 'overbought conditions — caution advised' : 'balanced momentum'}.
                The AI confidence score of {selectedAsset.aiScore}% reflects {selectedAsset.aiScore >= 65 ? 'high conviction in the bullish thesis backed by on-chain data, institutional flows, and technical confluence.' : 'mixed signals requiring further confirmation before taking significant position sizing.'}
                Suggested position sizing: {selectedAsset.aiScore >= 65 ? '3–5% of portfolio' : selectedAsset.aiScore >= 45 ? '1–2% with tight stops' : 'wait for clearer setup — reduce exposure'}.
              </p>
            </div>

            <button onClick={() => setSelectedAsset(null)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = '0.85'} onMouseOut={e => e.target.style.opacity = '1'}>
              Close Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
