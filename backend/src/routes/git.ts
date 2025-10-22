import express from 'express';
import * as gitService from '../services/gitService.js';

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    const isRepo = await gitService.isGitRepository();
    if (!isRepo) {
      return res.json({ success: true, data: [] });
    }
    
    const changes = await gitService.getGitStatus();
    res.json({ success: true, data: changes });
  } catch (error) {
    next(error);
  }
});

router.get('/diff', async (req, res, next) => {
  try {
    const isRepo = await gitService.isGitRepository();
    if (!isRepo) {
      return res.json({ success: true, data: '' });
    }
    
    const path = req.query.path as string;
    const diff = await gitService.getGitDiff(path);
    res.json({ success: true, data: diff });
  } catch (error) {
    next(error);
  }
});

router.post('/commit', async (req, res, next) => {
  try {
    const { message, files } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Commit message is required' });
    }
    
    await gitService.commitChanges(message, files);
    res.json({ success: true, message: 'Changes committed successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/push', async (req, res, next) => {
  try {
    const { remote = 'origin', branch = 'main' } = req.body;
    await gitService.pushChanges(remote, branch);
    res.json({ success: true, message: 'Changes pushed successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/pull', async (req, res, next) => {
  try {
    const { remote = 'origin', branch = 'main' } = req.body;
    await gitService.pullChanges(remote, branch);
    res.json({ success: true, message: 'Changes pulled successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/branch', async (req, res, next) => {
  try {
    const branch = await gitService.getCurrentBranch();
    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
});

router.get('/branches', async (req, res, next) => {
  try {
    const branches = await gitService.getBranches();
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
});

router.post('/branch', async (req, res, next) => {
  try {
    const { name, action = 'create' } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    
    if (action === 'create') {
      await gitService.createBranch(name);
    } else if (action === 'switch') {
      await gitService.switchBranch(name);
    }
    
    res.json({ success: true, message: `Branch ${action} successful` });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await gitService.getGitHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

export default router;

