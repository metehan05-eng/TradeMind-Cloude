import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes';
import marketRoutes from './routes/marketRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'TradeMind AI TypeScript Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount modular routes
app.use('/api', agentRoutes);
app.use('/api/market', marketRoutes);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 TradeMind AI TypeScript Agent Engine Running on port ${PORT}`);
  console.log(`📡 Tools registered: getMarketQuote, getHistoricalChart, searchMarketNews, getUserPortfolio`);
  console.log(`====================================================`);
});

export default app;
