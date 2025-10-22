import express from 'express';
import * as searchService from '../services/searchService.js';

const router = express.Router();

router.get('/web', async (req, res, next) => {
  try {
    const { query, source = 'all', limit = '20', language, sortBy } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const options = {
      limit: parseInt(limit as string),
      language: language as string,
      sortBy: sortBy as any,
    };
    
    const results = await searchService.searchSource(source as string, query as string, options);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const suggestions = await searchService.getSearchSuggestions(q as string);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
});

router.get('/code', async (req, res, next) => {
  try {
    const { query, language, limit = '10' } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const results = await searchService.searchCodeSnippets(query as string, language as string);
    res.json({ success: true, data: results.slice(0, parseInt(limit as string)) });
  } catch (error) {
    next(error);
  }
});

router.get('/docs', async (req, res, next) => {
  try {
    const { query, framework, limit = '10' } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    const results = await searchService.searchDocumentation(query as string, framework as string);
    res.json({ success: true, data: results.slice(0, parseInt(limit as string)) });
  } catch (error) {
    next(error);
  }
});

export default router;

