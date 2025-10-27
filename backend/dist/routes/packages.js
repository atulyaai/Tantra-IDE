import express from 'express';
import * as packageService from '../services/packageService.js';
const router = express.Router();
router.get('/detect-missing', async (req, res, next) => {
    try {
        const missing = await packageService.detectMissingDependencies();
        res.json({ success: true, data: missing });
    }
    catch (error) {
        next(error);
    }
});
router.post('/install', async (req, res, next) => {
    try {
        const { packageName, manager = 'npm' } = req.body;
        if (!packageName) {
            return res.status(400).json({ success: false, error: 'Package name is required' });
        }
        await packageService.installPackage(packageName, manager);
        res.json({ success: true, message: 'Package installed successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/tree', async (req, res, next) => {
    try {
        const manager = req.query.manager || 'npm';
        const tree = await packageService.getDependencyTree(manager);
        res.json({ success: true, data: tree });
    }
    catch (error) {
        next(error);
    }
});
router.post('/update', async (req, res, next) => {
    try {
        const { manager = 'npm' } = req.body;
        await packageService.updatePackages(manager);
        res.json({ success: true, message: 'Packages updated successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/manager', async (req, res, next) => {
    try {
        const manager = await packageService.detectPackageManager();
        res.json({ success: true, data: manager });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=packages.js.map