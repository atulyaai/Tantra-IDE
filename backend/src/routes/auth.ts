import express from 'express';
import { authService } from '../services/authService.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, and password are required' 
      });
    }
    
    const user = await authService.register(username, email, password);
    res.json({ success: true, data: { user: { ...user, passwordHash: undefined } } });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    const { user, session } = await authService.login(username, password, ipAddress, userAgent);
    
    res.json({ 
      success: true, 
      data: { 
        user: { ...user, passwordHash: undefined },
        session: { ...session, token: undefined, refreshToken: undefined }
      } 
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }
    
    await authService.logout(sessionId);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Logout all sessions
router.post('/logout-all', async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    await authService.logoutAll(userId);
    res.json({ success: true, message: 'All sessions logged out' });
  } catch (error) {
    next(error);
  }
});

// Validate token
router.post('/validate', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token is required' 
      });
    }
    
    const result = await authService.validateToken(token);
    
    if (result) {
      res.json({ 
        success: true, 
        data: { 
          user: { ...result.user, passwordHash: undefined },
          session: { ...result.session, token: undefined, refreshToken: undefined }
        } 
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refresh token is required' 
      });
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    if (result) {
      res.json({ 
        success: true, 
        data: { 
          token: result.token,
          session: { ...result.session, token: undefined, refreshToken: undefined }
        } 
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await authService.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      data: { user: { ...user, passwordHash: undefined } } 
    });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/preferences/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    await authService.updateUserPreferences(userId, preferences);
    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password and new password are required' 
      });
    }
    
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/users', async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();
    const sanitizedUsers = users.map(user => ({ ...user, passwordHash: undefined }));
    res.json({ success: true, data: { users: sanitizedUsers } });
  } catch (error) {
    next(error);
  }
});

// Get active sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await authService.getActiveSessions();
    const sanitizedSessions = sessions.map(session => ({ 
      ...session, 
      token: undefined, 
      refreshToken: undefined 
    }));
    res.json({ success: true, data: { sessions: sanitizedSessions } });
  } catch (error) {
    next(error);
  }
});

// Check permission
router.post('/permission', async (req, res, next) => {
  try {
    const { userId, permission } = req.body;
    
    if (!userId || !permission) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and permission are required' 
      });
    }
    
    const hasPermission = await authService.hasPermission(userId, permission);
    res.json({ success: true, data: { hasPermission } });
  } catch (error) {
    next(error);
  }
});

// Cleanup expired sessions
router.post('/cleanup', async (req, res, next) => {
  try {
    await authService.cleanupExpiredSessions();
    res.json({ success: true, message: 'Expired sessions cleaned up' });
  } catch (error) {
    next(error);
  }
});

export default router;