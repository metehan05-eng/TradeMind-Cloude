require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MASTER_SYSTEM_PROMPT = `
Role: Sen "TradeMind AI" projesinin baş stratejisti ve işletme yöneticisisin. Uluslararası ticaret, dijital e-ticaret trendleri, küresel lojistik ve kurumsal yönetim (ERP) konularında uzmansın.

Kabiliyetlerin & Modüllerin:
- Arbitraj Dedektörü: Küresel piyasalardaki (Emtia, Borsa, Ürün) fiyat farklarını navlun ve gümrük maliyetlerini düşerek analiz edersin.
- Ticaret Savaşları & Kriz Simülatörü: Jeopolitik krizlerin, döviz şoklarının ve vergi değişikliklerinin ticaret rotalarına ve şirket mali yapısına etkisini 3 ayrı senaryoda (İyimser, Gerçekçi, Kötümser) öngörürsün.
- Hukuk & Sözleşme Analizörü: WTO kuralları ve Incoterms ışığında sözleşmeleri denetler, riskleri raporlarsın.
- Lojistik & Stres Testi: Canlı gemi takibi verilerini kullanarak tedarik zinciri kırılmalarını tespit edersin.

Yanıtların her zaman profesyonel, veri odaklı ve ticari kârlılığı hedefleyen bir tonda olmalıdır.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sectorContext } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
            return res.json({ 
                response: "[API KEY EKSİK - DEMO MODU]\nGeçerli bir Gemini API Key bulunamadığı için otonom yanıt verilemiyor. Ancak mesajınızı aldım: '" + message + "'" 
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Kullanıcı Mesajı: ${message}\nEk Bağlam (Kullanıcı Sektörü): ${sectorContext || 'Genel Ticaret'}`,
            config: {
                systemInstruction: MASTER_SYSTEM_PROMPT,
                temperature: 0.7
            }
        });

        res.json({ response: response.text });

    } catch (error) {
        console.error("Gemini API Hatası:", error);
        res.status(500).json({ error: "Yapay zeka asistanı şu anda cevap veremiyor." });
    }
});

// Crisis & Stress Simulator 3-Scenario Generator
app.post('/api/crisis/simulate', async (req, res) => {
    try {
        const { prompt, scenarioTitle, sectorContext } = req.body;
        const inputContext = prompt || scenarioTitle || 'Genel Lojistik ve Döviz Krizi';

        if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
            const systemInstructions = `
                Sen TradeMind AI Kriz ve Stres Simülatörüsün.
                Sana verilen kriz/şok durumunu analiz ederek tam olarak 3 FARKLI SENARYO üretmelisin:
                1) optimistic (İyimser / Hızlı Uyum)
                2) moderate (Gerçekçi / Taban Risk)
                3) severe (Kötümser / Şiddetli Şok)

                Yanıtını SADECE geçerli bir JSON formatında ver. Başka hiçbir açıklama yazma. JSON formatı şöyle olmalıdır:
                {
                  "scenarios": [
                    {
                      "type": "optimistic",
                      "title": "İyimser Senaryo: ...",
                      "financialImpact": "+$15,000",
                      "financialImpactNumeric": 15000,
                      "riskLevel": "Düşük Şok",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    },
                    {
                      "type": "moderate",
                      "title": "Gerçekçi Senaryo: ...",
                      "financialImpact": "-$45,000",
                      "financialImpactNumeric": -45000,
                      "riskLevel": "Orta Şok",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    },
                    {
                      "type": "severe",
                      "title": "Kötümser Senaryo: ...",
                      "financialImpact": "-$124,000",
                      "financialImpactNumeric": -124000,
                      "riskLevel": "Şiddetli Şok",
                      "description": "...",
                      "planB": "...",
                      "actionButtonText": "..."
                    }
                  ]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Girilmiş Durum/Şok: "${inputContext}". Sektör: ${sectorContext || 'E-Ticaret ve Küresel İthalat/İhracat'}. Bu kriz için 3 senaryoyu JSON olarak üret.`,
                config: {
                    systemInstruction: systemInstructions,
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            });

            const parsedData = JSON.parse(response.text);
            return res.json(parsedData);
        }

        // High quality fallback scenarios if API key is not available
        return res.json(generateFallbackScenarios(inputContext));

    } catch (error) {
        console.error("Crisis simulation error:", error);
        return res.json(generateFallbackScenarios(req.body.prompt || req.body.scenarioTitle || 'Kriz'));
    }
});

function generateFallbackScenarios(context) {
    return {
        scenarios: [
            {
                type: "optimistic",
                title: "İyimser Senaryo: Hızlı Rota & Karbon Subvansiyonu",
                financialImpact: "+$12,500",
                financialImpactNumeric: 12500,
                riskLevel: "Düşük Risk",
                description: `"${context}" karşısında yerel stok esnekliği (%20 yedek stok) ve hızlı tedarik rotalama sayesinde kriz 7 günde atlatılır.`,
                planB: "İkinci tedarikçiye hızla geçilip bölgesel depolama devreye sokularak maliyet artışı engellenir.",
                actionButtonText: "Otonom Yerel Stok Rotalamasını Aktif Et"
            },
            {
                type: "moderate",
                title: "Gerçekçi Senaryo: Dengeli Maliyet Paslama & Hava Kargo",
                financialImpact: "-$42,000",
                financialImpactNumeric: -42000,
                riskLevel: "Orta Seviye Şok",
                description: `"${context}" durumu teslimat sürelerini 2 hafta uzatır, müşteriye teslimat süresi %25 gecikebilir.`,
                planB: "Kritik ürünler Hindistan ve Doğu Avrupa depolarından hava kargosu ile getirtilir. Hasar -$42,000 ile sınırlanır.",
                actionButtonText: "Hibrit Lojistik ve Depo Aktarımını Başlat"
            },
            {
                type: "severe",
                title: "Kötümser Senaryo: Tam Tedarik Kırılması & Kur Şoku",
                financialImpact: "-$138,000",
                financialImpactNumeric: -138000,
                riskLevel: "Şiddetli Şok Etkisi",
                description: `"${context}" sebebiyle tedarik kanalları 45 gün tamamen kilitlenir. Satış kaybı ve ceza oranları tavan yapar.`,
                planB: "Tüm sipariş akışı askıya alınır, likidite kalkanı devreye sokulur ve döviz kuru hedging protokolü başlatılır.",
                actionButtonText: "Acil Durum Likidite Kalkanını Devreye Al"
            }
        ]
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TradeMind Main Service running on port ${PORT}`);
});
