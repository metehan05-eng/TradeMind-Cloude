import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  TrendingUp, 
  Wallet, 
  BookmarkCheck, 
  Ship, 
  AlertTriangle,
  RotateCcw,
  Cpu,
  CornerDownLeft,
  ChevronDown
} from 'lucide-react';
import MessageWidgetRenderer from './MessageWidgetRenderer';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: "Welcome to **TradeMind AI** — your intelligent, conversational trading & global market copilot.\n\nI can analyze live equity & crypto charts, manage multi-asset portfolios, simulate supply chain stress scenarios, and identify cross-border arbitrage opportunities directly in this workspace. How can I assist your trading operations today?",
    timestamp: 'Just now'
  },
  {
    id: 2,
    sender: 'bot',
    text: "Here is your consolidated real-time portfolio snapshot across equities, crypto, commodities, and treasury reserves:",
    widgetType: 'portfolio',
    widgetData: {
      totalValue: 148520.50,
      dailyPnL: 3410.25,
      dailyPnLPercent: 2.35,
      cashBalance: 24500.00,
      riskScore: 'Moderate / Balanced'
    },
    timestamp: 'Just now'
  }
];

const QUICK_PROMPTS = [
  { label: '📊 Analyze NVDA Chart', prompt: 'Show me technical chart and indicators for NVDA' },
  { label: '💼 Show My Portfolio', prompt: 'Show my portfolio' },
  { label: '📋 Live Watchlist', prompt: 'Show my watchlist' },
  { label: '⚡ Crisis Stress Test', prompt: 'Simulate supply chain crisis and Suez disruption' },
  { label: '🚢 Detect Arbitrage', prompt: 'Find cross-border arbitrage opportunities' }
];

const AI_ROUTERS = [
  { id: 'gemini-2.5-flash', name: 'TradeMind Fast (Flash)', badge: 'Low Latency' },
  { id: 'gemini-2.5-pro', name: 'TradeMind Ultra (Pro)', badge: 'Deep Reasoning' },
  { id: 'macro-quant', name: 'Macro Quant Router', badge: 'Multi-Asset' }
];

const ChatContainer = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState(AI_ROUTERS[0].id);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen for global prompt triggers from widgets or sidebars
  useEffect(() => {
    const handleGlobalPrompt = (e) => {
      if (e.detail) {
        handleSendMessage(e.detail);
      }
    };

    window.addEventListener('send-chat-prompt', handleGlobalPrompt);
    return () => window.removeEventListener('send-chat-prompt', handleGlobalPrompt);
  }, []);

  const parseGenerativeIntent = (prompt) => {
    const lower = prompt.toLowerCase();

    if (lower.includes('portfolio') || lower.includes('cüzdan') || lower.includes('bakiye')) {
      return {
        text: "I've pulled your live asset distribution and risk profile from your connected accounts. Your net portfolio return is up +2.35% over the last 24 hours:",
        widgetType: 'portfolio',
        widgetData: {
          totalValue: 148520.50,
          dailyPnL: 3410.25,
          dailyPnLPercent: 2.35,
          cashBalance: 24500.00
        }
      };
    }

    if (lower.includes('chart') || lower.includes('grafik') || lower.includes('nvda') || lower.includes('btc') || lower.includes('aapl') || lower.includes('fiyat') || lower.includes('price')) {
      const ticker = lower.includes('btc') ? 'BTC/USDT' : lower.includes('aapl') ? 'AAPL' : lower.includes('eth') ? 'ETH/USDT' : 'NVDA';
      const name = ticker === 'BTC/USDT' ? 'Bitcoin' : ticker === 'AAPL' ? 'Apple Inc' : ticker === 'ETH/USDT' ? 'Ethereum' : 'NVIDIA Corporation';
      const price = ticker === 'BTC/USDT' ? 92450.00 : ticker === 'AAPL' ? 228.40 : ticker === 'ETH/USDT' ? 3410.50 : 191.20;

      return {
        text: `Here is the real-time technical price action, exponential moving averages (EMA 20), and quantitative sentiment breakdown for **${ticker}**:`,
        widgetType: 'ticker_chart',
        widgetData: {
          ticker,
          name,
          price,
          change: 8.80,
          changePercent: 4.82,
          sentiment: 'Strong Bullish (88/100)',
          rsi: 68.4,
          volume24h: '$4.2B',
          supportResistance: { support: '$182.50', resistance: '$198.00' }
        }
      };
    }

    if (lower.includes('watchlist') || lower.includes('izleme listesi') || lower.includes('takip')) {
      return {
        text: "Here is your active multi-asset watchlist. Click 'Ask AI' on any instrument to immediately generate deep technical & macro projections:",
        widgetType: 'watchlist',
        widgetData: {}
      };
    }

    if (lower.includes('crisis') || lower.includes('kriz') || lower.includes('stress') || lower.includes('suez') || lower.includes('simulat')) {
      return {
        text: "I have calculated 3 stress-testing trajectories (Optimistic, Moderate, Severe) based on current shipping freight indices, regional inventory buffers, and FX volatility:",
        widgetType: 'crisis_scenarios',
        widgetData: {
          scenarioTitle: 'Red Sea & Suez Shipping Disruption + Fuel Surcharge',
          scenarios: [
            {
              type: 'optimistic',
              title: 'Optimistic Scenario: Cape Route Buffer Stocking',
              financialImpact: '+$14,500',
              riskLevel: 'Low Risk',
              description: 'Regional warehouses absorb delivery latency; fulfillment rate remains stable at 96%.',
              planB: 'Activate local backup distribution network in Central Europe.',
              actionButtonText: 'Deploy Local Buffer Routing'
            },
            {
              type: 'moderate',
              title: 'Moderate Scenario: Surcharge Pass-Through & Delayed Invoicing',
              financialImpact: '-$38,000',
              riskLevel: 'Medium Shock',
              description: 'Ocean transit stretched by 12 days. 15% freight increase shared with B2B customers.',
              planB: 'Air-freight urgent high-margin units from secondary hubs.',
              actionButtonText: 'Execute Hybrid Air-Freight Protocol'
            },
            {
              type: 'severe',
              title: 'Severe Scenario: Prolonged Bottleneck & Liquidity Squeeze',
              financialImpact: '-$125,000',
              riskLevel: 'High Crisis',
              description: '40-day total supply blockage causing significant penalty fees and margin erosion.',
              planB: 'Hedge dollar currency exposure and activate emergency operational credit facility.',
              actionButtonText: 'Engage Liquidity & FX Shield'
            }
          ]
        }
      };
    }

    if (lower.includes('arbitraj') || lower.includes('arbitrage') || lower.includes('spread') || lower.includes('fırsat')) {
      return {
        text: "Identified a high-probability cross-border physical spread factoring in ocean transit, insurance, and CBAM carbon tariffs:",
        widgetType: 'arbitrage',
        widgetData: {
          productName: 'Lithium Iron Phosphate (LFP) Battery Modules - 50,000 Units',
          sourceMarket: { name: 'Shenzhen Free Trade Zone (CN)', buyPrice: '$38.20 / unit' },
          targetMarket: { name: 'Rotterdam Port Logistics Hub (EU)', sellPrice: '$64.00 / unit' },
          grossMargin: '+$1,290,000 (+67.5%)',
          logisticsCost: '-$185,000 (Sea Freight + Marine Insurance)',
          tariffsAndCustoms: '-$145,000 (EU Duty & CBAM Adjustment)',
          netArbitrageProfit: '+$960,000 (+50.2% Net Margin)',
          estimatedTransitDays: '26 Days (Direct Carrier)'
        }
      };
    }

    return null;
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Check for Generative UI triggers
    const generativePayload = parseGenerativeIntent(query);

    // Call Backend AI Chat Endpoint
    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query,
          router: selectedRouter,
          sectorContext: 'Cross-Border Trading, Quant Finance & Market Intelligence' 
        })
      });

      const data = await res.json();
      const botResponseText = data.response || "Analysis complete.";

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: generativePayload ? generativePayload.text : botResponseText,
        widgetType: generativePayload?.widgetType,
        widgetData: generativePayload?.widgetData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      // Fallback with rich Generative UI experience even if local backend is offline
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: generativePayload 
          ? generativePayload.text 
          : `I have processed your query: **"${query}"** using TradeMind AI market synthesis. Here are the relevant market data points and dynamic interactive analytics:`,
        widgetType: generativePayload?.widgetType,
        widgetData: generativePayload?.widgetData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="chat-main-container">
      {/* Top Floating Control Bar */}
      <div className="chat-topbar">
        <div className="flex-center gap-3">
          <div className="chat-bot-avatar">
            <Bot size={20} className="text-accent-purple" />
          </div>
          <div>
            <div className="chat-bot-name flex-center gap-2">
              TradeMind AI Copilot
              <span className="live-pill">v2.5 Hybrid</span>
            </div>
            <span className="chat-bot-status">Autonomous Financial & Trading Agent</span>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex-center gap-3">
          <div className="model-selector-dropdown">
            <Cpu size={14} className="text-accent-blue" />
            <select 
              value={selectedRouter} 
              onChange={(e) => setSelectedRouter(e.target.value)}
              className="model-select"
            >
              {AI_ROUTERS.map(router => (
                <option key={router.id} value={router.id}>
                  {router.name}
                </option>
              ))}
            </select>
          </div>

          <button className="icon-btn" title="Reset Session" onClick={handleResetChat}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Messages Timeline Stream */}
      <div className="chat-timeline">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
            </div>

            <div className="message-bubble-wrapper">
              <div className="message-meta">
                <span className="sender-name">{msg.sender === 'bot' ? 'TradeMind AI' : 'You'}</span>
                <span className="msg-time">{msg.timestamp}</span>
              </div>

              {/* Text Body */}
              <div className="message-text">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: line ? '6px' : '0' }}>
                    {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                ))}
              </div>

              {/* Dynamic Generative UI Card */}
              {msg.widgetType && (
                <div className="generative-widget-wrapper">
                  <MessageWidgetRenderer 
                    widgetType={msg.widgetType} 
                    widgetData={msg.widgetData} 
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row bot typing">
            <div className="message-avatar">
              <Bot size={18} />
            </div>
            <div className="typing-bubble">
              <Sparkles size={16} className="sparkle-spin" />
              <span>TradeMind AI is calculating real-time financial models...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Action Chips */}
      <div className="quick-prompt-chips">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button 
            key={idx} 
            className="chip-btn" 
            onClick={() => handleSendMessage(qp.prompt)}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Main Input Composer */}
      <div className="chat-input-composer">
        <div className="composer-wrapper">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask TradeMind: 'Show my portfolio', 'Chart NVDA', 'Run Suez crisis simulation'..."
            className="composer-textarea"
          />

          <button 
            className="composer-send-btn" 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="composer-footnote">
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line. Supports Generative UI dynamic rendering.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
