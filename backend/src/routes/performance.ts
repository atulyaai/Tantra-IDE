import express from 'express';
import * as performanceService from '../services/performanceService.js';

const router = express.Router();

router.get('/bundle', async (req, res, next) => {
  try {
    const analysis = await performanceService.analyzeBundle();
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

router.get('/lighthouse', async (req, res, next) => {
  try {
    const { url } = req.query;
    const report = await performanceService.runPerformanceProfile(url as string);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.get('/memory', async (req, res, next) => {
  try {
    const profile = await performanceService.runMemoryProfile();
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.get('/cpu', async (req, res, next) => {
  try {
    const { duration = '10000' } = req.query;
    const profile = await performanceService.runCPUProfile(parseInt(duration as string));
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.get('/network', async (req, res, next) => {
  try {
    const { url } = req.query;
    const analysis = await performanceService.analyzeNetworkRequests(url as string);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

router.get('/report', async (req, res, next) => {
  try {
    const report = await performanceService.generatePerformanceReport();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const { bundle, lighthouse } = req.body;
    const suggestions = await performanceService.getOptimizationSuggestions(bundle, lighthouse);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
});

export default router;
