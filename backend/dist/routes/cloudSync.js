import express from 'express';
import { cloudSyncService } from '../services/cloudSyncService.js';
const router = express.Router();
// Enable cloud sync
router.post('/enable', async (req, res, next) => {
    try {
        const { provider, repository, token } = req.body;
        if (!provider) {
            return res.status(400).json({
                success: false,
                error: 'Provider is required'
            });
        }
        await cloudSyncService.enableSync(provider, repository, token);
        res.json({ success: true, message: 'Cloud sync enabled' });
    }
    catch (error) {
        next(error);
    }
});
// Disable cloud sync
router.post('/disable', async (req, res, next) => {
    try {
        await cloudSyncService.disableSync();
        res.json({ success: true, message: 'Cloud sync disabled' });
    }
    catch (error) {
        next(error);
    }
});
// Update sync configuration
router.put('/config', async (req, res, next) => {
    try {
        const config = req.body;
        await cloudSyncService.updateConfig(config);
        res.json({ success: true, message: 'Configuration updated' });
    }
    catch (error) {
        next(error);
    }
});
// Get sync configuration
router.get('/config', async (req, res, next) => {
    try {
        const config = await cloudSyncService.getConfig();
        res.json({ success: true, data: config });
    }
    catch (error) {
        next(error);
    }
});
// Get sync status
router.get('/status', async (req, res, next) => {
    try {
        const status = await cloudSyncService.getSyncStatus();
        res.json({ success: true, data: status });
    }
    catch (error) {
        next(error);
    }
});
// Get sync items
router.get('/items', async (req, res, next) => {
    try {
        const items = await cloudSyncService.getSyncItems();
        res.json({ success: true, data: items });
    }
    catch (error) {
        next(error);
    }
});
// Force sync
router.post('/sync', async (req, res, next) => {
    try {
        await cloudSyncService.forceSync();
        res.json({ success: true, message: 'Sync completed' });
    }
    catch (error) {
        next(error);
    }
});
// Resolve conflict
router.post('/conflicts/:id/resolve', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;
        if (!resolution || !['local', 'remote', 'merge'].includes(resolution)) {
            return res.status(400).json({
                success: false,
                error: 'Valid resolution is required (local, remote, or merge)'
            });
        }
        await cloudSyncService.resolveConflict(id, resolution);
        res.json({ success: true, message: 'Conflict resolved' });
    }
    catch (error) {
        next(error);
    }
});
// Scan workspace
router.post('/scan', async (req, res, next) => {
    try {
        await cloudSyncService.scanWorkspace();
        res.json({ success: true, message: 'Workspace scanned' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=cloudSync.js.map