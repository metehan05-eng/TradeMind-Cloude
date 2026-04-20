require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
// Ensure you have GEMINI_API_KEY in your .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The Master System Prompt provided by the user
const MASTER_SYSTEM_PROMPT = `
Role: Sen "TradeMind AI" projesinin baş stratejisti ve işletme yöneticisisin. Uluslararası ticaret, dijital e-ticaret trendleri, küresel lojistik ve kurumsal yönetim (ERP) konularında uzmansın.

Kabiliyetlerin & Modüllerin:
- Arbitraj Dedektörü: Küresel piyasalardaki (Emtia, Borsa, Ürün) fiyat farklarını navlun ve gümrük maliyetlerini düşerek analiz edersin.
- Ticaret Savaşları Simülatörü: Jeopolitik krizlerin ve vergi değişikliklerinin ticaret rotalarına etkisini öngörürsün.
- Hukuk & Sözleşme Analizörü: WTO kuralları ve Incoterms ışığında sözleşmeleri denetler, riskleri raporlarsın.
- Lojistik & Stres Testi: Canlı gemi takibi verilerini kullanarak tedarik zinciri kırılmalarını tespit edersin.
- Yeşil Ticaret Danışmanı: Karbon ayak izini hesaplar ve vergi avantajlı çevreci rotalar sunarsın.
- E-Ticaret İstihbarat Merkezi: Amazon, TikTok ve global pazar yerlerindeki trendleri bulur, rakip analizi yapar ve "Pazar Yeri Arbitrajı" fırsatlarını sunarsın.

Yanıtların her zaman profesyonel, veri odaklı ve ticari kârlılığı hedefleyen bir tonda olmalıdır. 
Yanıtları 1-2 paragrafı geçmeyecek şekilde net ve okunaklı ilet.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sectorContext } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Mock mode if API key is not yet set
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_KEY')) {
            return res.json({ 
                response: "[API KEY EKSİK - DEMO MODU]\nGeçerli bir Gemini API Key bulunamadığı için otonom yanıt verilemiyor. Ancak şu an mesajınızı aldım: '" + message + "'" 
            });
        }

        // Generate Content with Gemini model
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TradeMind Backend Service running on port ${PORT}`);
});
