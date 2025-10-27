import express from 'express';
import { pluginManager } from '../services/pluginService.js';

const router = express.Router();

// Get all plugins
router.get('/', async (req, res, next) => {
  try {
    const plugins = pluginManager.getPlugins();
    res.json({ success: true, data: plugins });
  } catch (error) {
    next(error);
  }
});

// Get specific plugin
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const plugin = pluginManager.getPlugin(id);
    
    if (!plugin) {
      return res.status(404).json({ success: false, error: 'Plugin not found' });
    }
    
    res.json({ success: true, data: plugin });
  } catch (error) {
    next(error);
  }
});

// Install plugin
router.post('/install', async (req, res, next) => {
  try {
    const { packageName, version } = req.body;
    
    if (!packageName) {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }
    
    const plugin = await pluginManager.installPlugin(packageName, version);
    res.json({ success: true, data: plugin });
  } catch (error) {
    next(error);
  }
});

// Uninstall plugin
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pluginManager.uninstallPlugin(id);
    res.json({ success: true, message: 'Plugin uninstalled successfully' });
  } catch (error) {
    next(error);
  }
});

// Enable plugin
router.post('/:id/enable', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pluginManager.enablePlugin(id);
    res.json({ success: true, message: 'Plugin enabled successfully' });
  } catch (error) {
    next(error);
  }
});

// Disable plugin
router.post('/:id/disable', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pluginManager.disablePlugin(id);
    res.json({ success: true, message: 'Plugin disabled successfully' });
  } catch (error) {
    next(error);
  }
});

// Execute plugin command
router.post('/command', async (req, res, next) => {
  try {
    const { command, context } = req.body;
    
    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }
    
    const result = await pluginManager.executeCommand(command, context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get plugin commands
router.get('/commands/list', async (req, res, next) => {
  try {
    const commands = pluginManager.getCommands();
    res.json({ success: true, data: commands });
  } catch (error) {
    next(error);
  }
});

// Get plugin keybindings
router.get('/keybindings/list', async (req, res, next) => {
  try {
    const keybindings = pluginManager.getKeybindings();
    res.json({ success: true, data: keybindings });
  } catch (error) {
    next(error);
  }
});

// Get plugin views
router.get('/views/list', async (req, res, next) => {
  try {
    const views = pluginManager.getViews();
    res.json({ success: true, data: views });
  } catch (error) {
    next(error);
  }
});

// Get plugin languages
router.get('/languages/list', async (req, res, next) => {
  try {
    const languages = pluginManager.getLanguages();
    res.json({ success: true, data: languages });
  } catch (error) {
    next(error);
  }
});

// Load all plugins
router.post('/load-all', async (req, res, next) => {
  try {
    const plugins = await pluginManager.loadAllPlugins();
    res.json({ success: true, data: plugins });
  } catch (error) {
    next(error);
  }
});

export default router;