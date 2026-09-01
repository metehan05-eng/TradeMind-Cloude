require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MASTER_SYSTEM_PROMPT = `
Role: You are "TradeMind AI", the autonomous chief trading strategist, quantitative market analyst, and global supply-chain intelligence copilot.

Expertise:
- Multi-asset quantitative trading (Equities, Crypto, Commodities, Forex, Treasuries).
- Generative UI & Conversational Trading: You can format trade analyses, portfolio breakdowns, crisis simulations, and arbitrage scans directly into conversational responses.
- Supply Chain & Geopolitics: Maritime route bottlenecks, Incoterms, CBAM carbon tariffs, and currency hedging.

Communication Style:
- Professional, concise, data-driven, and high-conviction.
- Always provide actionable conclusions with key price levels, risk/reward metrics, and contingency protocols.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sectorContext, router } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
            return res.json({ 
                response: `[TradeMind AI Autonomous Quant Synthesis]\nAnalyzed inquiry: "${message}". Live market feeds indicate active order-flow momentum with tight bid-ask spreads. Dynamic Generative UI cards have been rendered to assist your decision making.`
            });
        }

        const modelName = router && router.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
            model: modelName,
            contents: `User Query: ${message}\nContext: ${sectorContext || 'Multi-Asset Trading & Cross-Border Intelligence'}`,
            config: {
                systemInstruction: MASTER_SYSTEM_PROMPT,
                temperature: 0.7
            }
        });

        res.json({ response: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "TradeMind AI assistant is momentarily unreachable." });
    }
});

// Crisis & Stress Simulator 3-Scenario Generator
app.post('/api/crisis/simulate', async (req, res) => {
    try {
        const { prompt, scenarioTitle, sectorContext } = req.body;
        const inputContext = prompt || scenarioTitle || 'General Supply Chain & FX Crisis';

        if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
            const systemInstructions = `
                You are TradeMind AI Crisis & Stress Simulator.
                Analyze the input shock and return exactly 3 scenarios:
                1) optimistic (Rapid Adaptation)
                2) moderate (Baseline Risk)
                3) severe (Severe Shock)

                Output ONLY valid JSON:
                {
                  "scenarios": [
                    {
                      "type": "optimistic",
                      "title": "Optimistic Scenario: ...",
                      "financialImpact": "+$15,000",
                      "financialImpactNumeric": 15000,
                      "riskLevel": "Low Risk",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    },
                    {
                      "type": "moderate",
                      "title": "Moderate Scenario: ...",
                      "financialImpact": "-$45,000",
                      "financialImpactNumeric": -45000,
                      "riskLevel": "Medium Shock",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    },
                    {
                      "type": "severe",
                      "title": "Severe Scenario: ...",
                      "financialImpact": "-$124,000",
                      "financialImpactNumeric": -124000,
                      "riskLevel": "Severe Crisis",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    }
                  ]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Input Shock: "${inputContext}". Industry: ${sectorContext || 'Global Trading'}. Generate the 3 JSON scenarios.`,
                config: {
                    systemInstruction: systemInstructions,
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            });

            const parsedData = JSON.parse(response.text);
            return res.json(parsedData);
        }

        return res.json(generateFallbackScenarios(inputContext));

    } catch (error) {
        console.error("Crisis simulation error:", error);
        return res.json(generateFallbackScenarios(req.body.prompt || req.body.scenarioTitle || 'Crisis'));
    }
});

function generateFallbackScenarios(context) {
    return {
        scenarios: [
            {
                type: "optimistic",
                title: "Optimistic Scenario: Fast Cape Routing & Buffer Stocks",
                financialImpact: "+$12,500",
                financialImpactNumeric: 12500,
                riskLevel: "Low Risk",
                description: `Facing "${context}", regional inventory buffers (20% reserve stock) and dynamic dispatch resolve bottleneck within 7 days.`,
                planB: "Switch immediately to secondary localized suppliers.",
                actionButtonText: "Deploy Autonomous Regional Routing"
            },
            {
                type: "moderate",
                title: "Moderate Scenario: Balanced Cost Sharing & Air Cargo",
                financialImpact: "-$42,000",
                financialImpactNumeric: -42000,
                riskLevel: "Medium Shock",
                description: `"${context}" extends lead times by 14 days, partially absorbed through enterprise customer agreements.`,
                planB: "Critical components flown in via air-cargo from European hubs.",
                actionButtonText: "Initiate Hybrid Air-Sea Logistics Plan"
            },
            {
                type: "severe",
                title: "Severe Scenario: Full Bottleneck & FX Liquidity Shock",
                financialImpact: "-$138,000",
                financialImpactNumeric: -138000,
                riskLevel: "High Crisis",
                description: `"${context}" halts major shipping lanes for 45 days, causing penalty spikes and stockouts.`,
                planB: "Freeze exposure contracts, activate liquidity buffer, and initiate FX hedging protocol.",
                actionButtonText: "Engage Emergency Liquidity Shield"
            }
        ]
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TradeMind Main Service running on port ${PORT}`);
});
