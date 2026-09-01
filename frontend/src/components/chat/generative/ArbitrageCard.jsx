import React from 'react';
import { Ship, ArrowRight, DollarSign, CheckCircle2, RefreshCw } from 'lucide-react';

const ArbitrageCard = ({ data }) => {
  const {
    productName = 'Lithium Battery Cells (Grade A) - 100k Units',
    sourceMarket = { name: 'Shenzhen / Yantian Hub (CN)', buyPrice: '$42.50 / unit' },
    targetMarket = { name: 'Rotterdam Euro Terminal (EU)', sellPrice: '$68.20 / unit' },
    grossMargin = '+$2,570,000 (+60.4%)',
    logisticsCost = '-$380,000 (Ocean Freight + Insurance)',
    tariffsAndCustoms = '-$290,000 (CBAM + EU Import Duty)',
    netArbitrageProfit = '+$1,900,000 (+44.7% Net ROI)',
    estimatedTransitDays = '28 Days (Direct Route)'
  } = data || {};

  return (
    <div className="gen-ui-card arbitrage-gen-card">
      <div className="gen-card-header">
        <div className="flex-center gap-2">
          <div className="gen-card-icon">
            <Ship size={18} />
          </div>
          <div>
            <h4 className="gen-card-title">Cross-Border Arbitrage Opportunity</h4>
            <span className="gen-card-subtitle">{productName}</span>
          </div>
        </div>
        <span className="gen-pill success">Net ROI: +44.7%</span>
      </div>

      {/* Trade Route Diagram */}
      <div className="arbitrage-route-box">
        <div className="route-node">
          <div className="node-badge">Buy Market</div>
          <div className="node-title">{sourceMarket.name}</div>
          <div className="node-price">{sourceMarket.buyPrice}</div>
        </div>

        <div className="route-connector">
          <span className="route-transit">{estimatedTransitDays}</span>
          <div className="route-line">
            <ArrowRight size={18} className="arrow-pulse" />
          </div>
        </div>

        <div className="route-node">
          <div className="node-badge dest">Target Market</div>
          <div className="node-title">{targetMarket.name}</div>
          <div className="node-price">{targetMarket.sellPrice}</div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="arbitrage-breakdown-grid">
        <div className="arb-stat-item">
          <span className="arb-label">Gross Spread</span>
          <span className="arb-val text-green">{grossMargin}</span>
        </div>
        <div className="arb-stat-item">
          <span className="arb-label">Freight & Marine Ins.</span>
          <span className="arb-val text-amber">{logisticsCost}</span>
        </div>
        <div className="arb-stat-item">
          <span className="arb-label">Tariffs & Customs</span>
          <span className="arb-val text-amber">{tariffsAndCustoms}</span>
        </div>
        <div className="arb-stat-item highlight">
          <span className="arb-label">Net Projected Profit</span>
          <span className="arb-val neon-green-text">{netArbitrageProfit}</span>
        </div>
      </div>

      <div className="gen-card-footer">
        <span className="card-hint">Calculated with live bunker fuel rates and CBAM adjustments</span>
        <button 
          className="gen-action-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('send-chat-prompt', { detail: `Initiate supplier contact and freight booking quote for ${productName}` }))}
        >
          <CheckCircle2 size={14} /> Request RFQ & Forwarder Quote
        </button>
      </div>
    </div>
  );
};

export default ArbitrageCard;
