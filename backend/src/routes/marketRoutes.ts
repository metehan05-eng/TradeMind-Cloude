import { Router, Request, Response } from 'express';
import { getMarketQuote, getHistoricalChart } from '../tools/marketTools';
import { searchMarketNews } from '../tools/newsTools';
import { getUserPortfolio } from '../tools/portfolioTools';

const router = Router();

// GET /api/market/quote?symbols=NVDA,BTC,THYAO
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const rawSymbols = (req.query.symbols as string) || 'NVDA,BTC,THYAO';
    const symbols = rawSymbols.split(',').map(s => s.trim());
    const quotes = await getMarketQuote(symbols);
    return res.json(quotes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/market/chart/:symbol
router.get('/chart/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
    const interval = (req.query.interval as any) || '1d';
    const range = (req.query.range as any) || '1mo';

    const chart = await getHistoricalChart(symbol, interval, range);
    return res.json(chart);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/market/news?query=fed
router.get('/news', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || 'global market economy';
    const news = await searchMarketNews(query);
    return res.json(news);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/market/portfolio
router.get('/portfolio', async (req: Request, res: Response) => {
  try {
    const portfolio = await getUserPortfolio();
    return res.json(portfolio);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
