import express from 'express';
import { checkOllamaConnection, listModels } from '../services/ollamaService.js';

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const connected = await checkOllamaConnection();
    res.json({ success: true, data: { connected } });
  } catch (error) {
    next(error);
  }
});

router.get('/models', async (req, res, next) => {
  try {
    const models = await listModels();
    res.json({ success: true, data: models });
  } catch (error) {
    next(error);
  }
});

export default router;

