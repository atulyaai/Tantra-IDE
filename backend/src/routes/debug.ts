import express from 'express';
import { debugService } from '../services/debugService.js';

const router = express.Router();

// Create debug session
router.post('/sessions', async (req, res, next) => {
  try {
    const { name, type, config } = req.body;
    
    if (!name || !type || !config) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, type, and config are required' 
      });
    }
    
    const session = await debugService.createSession(name, type, config);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Start debug session
router.post('/sessions/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.startSession(id);
    res.json({ success: true, message: 'Debug session started' });
  } catch (error) {
    next(error);
  }
});

// Stop debug session
router.post('/sessions/:id/stop', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.stopSession(id);
    res.json({ success: true, message: 'Debug session stopped' });
  } catch (error) {
    next(error);
  }
});

// Pause debug session
router.post('/sessions/:id/pause', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.pauseSession(id);
    res.json({ success: true, message: 'Debug session paused' });
  } catch (error) {
    next(error);
  }
});

// Resume debug session
router.post('/sessions/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.resumeSession(id);
    res.json({ success: true, message: 'Debug session resumed' });
  } catch (error) {
    next(error);
  }
});

// Get debug session
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = debugService.getSession(id);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Debug session not found' });
    }
    
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Get all debug sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = debugService.getAllSessions();
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// Add breakpoint
router.post('/sessions/:id/breakpoints', async (req, res, next) => {
  try {
    const { id } = req.params;
    const breakpoint = req.body;
    
    if (!breakpoint.file || !breakpoint.line) {
      return res.status(400).json({ 
        success: false, 
        error: 'File and line are required' 
      });
    }
    
    const newBreakpoint = await debugService.addBreakpoint(id, breakpoint);
    res.json({ success: true, data: newBreakpoint });
  } catch (error) {
    next(error);
  }
});

// Remove breakpoint
router.delete('/sessions/:id/breakpoints/:breakpointId', async (req, res, next) => {
  try {
    const { id, breakpointId } = req.params;
    await debugService.removeBreakpoint(id, breakpointId);
    res.json({ success: true, message: 'Breakpoint removed' });
  } catch (error) {
    next(error);
  }
});

// Update breakpoint
router.put('/sessions/:id/breakpoints/:breakpointId', async (req, res, next) => {
  try {
    const { id, breakpointId } = req.params;
    const updates = req.body;
    
    await debugService.updateBreakpoint(id, breakpointId, updates);
    res.json({ success: true, message: 'Breakpoint updated' });
  } catch (error) {
    next(error);
  }
});

// Step over
router.post('/sessions/:id/step-over', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.stepOver(id);
    res.json({ success: true, message: 'Step over executed' });
  } catch (error) {
    next(error);
  }
});

// Step into
router.post('/sessions/:id/step-into', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.stepInto(id);
    res.json({ success: true, message: 'Step into executed' });
  } catch (error) {
    next(error);
  }
});

// Step out
router.post('/sessions/:id/step-out', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.stepOut(id);
    res.json({ success: true, message: 'Step out executed' });
  } catch (error) {
    next(error);
  }
});

// Continue
router.post('/sessions/:id/continue', async (req, res, next) => {
  try {
    const { id } = req.params;
    await debugService.continue(id);
    res.json({ success: true, message: 'Continue executed' });
  } catch (error) {
    next(error);
  }
});

// Evaluate expression
router.post('/sessions/:id/evaluate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expression } = req.body;
    
    if (!expression) {
      return res.status(400).json({ 
        success: false, 
        error: 'Expression is required' 
      });
    }
    
    const result = await debugService.evaluateExpression(id, expression);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get variables
router.get('/sessions/:id/variables', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { frameId } = req.query;
    
    const variables = await debugService.getVariables(id, frameId ? parseInt(frameId as string) : undefined);
    res.json({ success: true, data: Array.from(variables.entries()) });
  } catch (error) {
    next(error);
  }
});

// Get call stack
router.get('/sessions/:id/call-stack', async (req, res, next) => {
  try {
    const { id } = req.params;
    const callStack = await debugService.getCallStack(id);
    res.json({ success: true, data: callStack });
  } catch (error) {
    next(error);
  }
});

// Set current frame
router.post('/sessions/:id/frame', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { frameId } = req.body;
    
    if (frameId === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Frame ID is required' 
      });
    }
    
    await debugService.setCurrentFrame(id, frameId);
    res.json({ success: true, message: 'Current frame set' });
  } catch (error) {
    next(error);
  }
});

export default router;