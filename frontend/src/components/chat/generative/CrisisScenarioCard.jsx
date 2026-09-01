import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Flame, ArrowRight, Play } from 'lucide-react';

const CrisisScenarioCard = ({ data }) => {
  const {
    scenarioTitle = 'Supply Chain Suez Disruption & Energy Shock',
    scenarios = [
      {
        type: 'optimistic',
        title: 'Optimistic Scenario: Adaptive Routing & Buffer Stocks',
        financialImpact: '+$12,500',
        financialImpactNumeric: 12500,
        riskLevel: 'Low Risk',
        description: '20% regional buffer inventory & immediate Cape route rerouting keeps fulfillment above 94%.',
        planB: 'Switch immediately to secondary localized suppliers.',
        actionButtonText: 'Deploy Localized Inventory Routing'
      },
      {
        type: 'moderate',
        title: 'Moderate Scenario: Freight Surcharge Absorption',
        financialImpact: '-$42,000',
        financialImpactNumeric: -42000,
        riskLevel: 'Medium Shock',
        description: 'Delivery lead times stretch by 14 days. 18% freight increase partially passed to enterprise tier.',
        planB: 'Air-freight critical micro-components from European hubs.',
        actionButtonText: 'Execute Hybrid Air-Sea Logistics Plan'
      },
      {
        type: 'severe',
        title: 'Severe Scenario: Full Bottleneck & Currency Devaluation',
        financialImpact: '-$138,000',
        financialImpactNumeric: -138000,
        riskLevel: 'High Crisis',
        description: 'Complete maritime blockage for 45 days. Major cancellation wave and penalties.',
        planB: 'Freeze high-exposure contracts and initiate emergency FX hedge protocol.',
        actionButtonText: 'Activate Liquidity Shield & FX Hedging'
      }
    ]
  } = data || {};

  const [activeTab, setActiveTab] = useState(0);
  const [executed, setExecuted] = useState({});

  const handleExecute = (index, actionText) => {
    setExecuted(prev => ({ ...prev, [index]: true }));
    window.dispatchEvent(new CustomEvent('send-chat-prompt', {
      detail: `Execute crisis response protocol: "${actionText}" for scenario "${scenarios[index]?.title}"`
    }));
  };

  const getScenarioTheme = (type) => {
    switch (type) {
      case 'optimistic':
        return { badge: 'badge-optimistic', icon: <ShieldCheck size={16} className="text-green" />, color: 'var(--accent-green)' };
      case 'moderate':
        return { badge: 'badge-moderate', icon: <AlertTriangle size={16} className="text-amber" />, color: '#f59e0b' };
      case 'severe':
      default:
        return { badge: 'badge-severe', icon: <Flame size={16} className="text-red" />, color: '#ef4444' };
    }
  };

  const current = scenarios[activeTab] || scenarios[0];
  const theme = getScenarioTheme(current.type);

  return (
    <div className="gen-ui-card crisis-scenario-card">
      <div className="gen-card-header">
        <div className="flex-center gap-2">
          <div className="gen-card-icon alert-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="gen-card-title">Macro Crisis & Stress Test Simulation</h4>
            <span className="gen-card-subtitle">{scenarioTitle}</span>
          </div>
        </div>
        <span className="gen-pill alert">3 Scenarios Modelled</span>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="scenario-tabs-nav">
        {scenarios.map((sc, idx) => {
          const scTheme = getScenarioTheme(sc.type);
          return (
            <button
              key={idx}
              className={`scenario-tab-btn ${activeTab === idx ? 'active' : ''} ${sc.type}`}
              onClick={() => setActiveTab(idx)}
            >
              {scTheme.icon}
              <span className="tab-type-label">{sc.type.toUpperCase()}</span>
              <span className="tab-impact-label">{sc.financialImpact}</span>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Card Body */}
      <div className="scenario-body-panel">
        <div className="scenario-header-row">
          <h5 className="scenario-heading">{current.title}</h5>
          <div className="scenario-impact-badge" style={{ color: theme.color }}>
            Est. Impact: <strong>{current.financialImpact}</strong> ({current.riskLevel})
          </div>
        </div>

        <p className="scenario-desc">{current.description}</p>

        <div className="plan-b-box">
          <div className="plan-b-label">Mitigation Plan & Contingency:</div>
          <div className="plan-b-text">{current.planB}</div>
        </div>

        <div className="scenario-action-row">
          <button
            className={`execute-protocol-btn ${executed[activeTab] ? 'executed' : ''}`}
            onClick={() => handleExecute(activeTab, current.actionButtonText)}
            disabled={executed[activeTab]}
          >
            {executed[activeTab] ? (
              <>
                <ShieldCheck size={16} /> Protocol Active in ERP
              </>
            ) : (
              <>
                <Play size={15} /> {current.actionButtonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisScenarioCard;
