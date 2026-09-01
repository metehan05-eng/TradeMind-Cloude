import { Router, Request, Response } from 'express';
import { qwenAgent } from '../services/qwenAgent';
import { REGISTERED_TOOLS, executeToolCall } from '../tools/toolRegistry';

const router = Router();

// POST /api/chat - Main Conversational & Agentic Endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const agentResult = await qwenAgent.runAgentLoop(message, history || []);

    return res.json({
      response: agentResult.response,
      toolCallsExecuted: agentResult.toolCallsExecuted,
      widgetType: agentResult.generativeWidget?.widgetType,
      widgetData: agentResult.generativeWidget?.widgetData
    });
  } catch (error: any) {
    console.error('Agent route error:', error);
    return res.status(500).json({ error: 'TradeMind AI agent could not complete processing' });
  }
});

// GET /api/tools - Returns registered function calling schemas
router.get('/tools', (req: Request, res: Response) => {
  return res.json({
    tools: REGISTERED_TOOLS
  });
});

// POST /api/tools/execute - Direct manual tool invocation endpoint
router.post('/tools/execute', async (req: Request, res: Response) => {
  try {
    const { name, args } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const result = await executeToolCall(name, args || {});
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
