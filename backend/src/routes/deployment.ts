import express from 'express';
import * as deploymentService from '../services/deploymentService.js';

const router = express.Router();

router.post('/deploy', async (req, res, next) => {
  try {
    const { platform, projectName, buildCommand, outputDirectory, environmentVariables, customDomain } = req.body;
    
    if (!platform || !projectName) {
      return res.status(400).json({ success: false, error: 'Platform and project name are required' });
    }

    const config = {
      platform,
      projectName,
      buildCommand,
      outputDirectory,
      environmentVariables,
      customDomain,
    };

    const result = await deploymentService.deployProject(config);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/platforms', async (req, res, next) => {
  try {
    const platforms = await deploymentService.checkPlatformAvailability();
    res.json({ success: true, data: platforms });
  } catch (error) {
    next(error);
  }
});

router.get('/config', async (req, res, next) => {
  try {
    const config = await deploymentService.detectDeploymentConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const history = await deploymentService.getDeploymentHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

router.post('/install-cli', async (req, res, next) => {
  try {
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required' });
    }

    let command: string;
    switch (platform) {
      case 'vercel':
        command = 'npm install -g vercel';
        break;
      case 'netlify':
        command = 'npm install -g netlify-cli';
        break;
      case 'aws':
        return res.status(400).json({ 
          success: false, 
          error: 'AWS CLI must be installed manually. Visit: https://aws.amazon.com/cli/' 
        });
      default:
        return res.status(400).json({ success: false, error: 'Unsupported platform' });
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync(command);
    res.json({ success: true, message: `${platform} CLI installed successfully` });
  } catch (error) {
    next(error);
  }
});

export default router;