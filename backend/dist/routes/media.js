import express from 'express';
import * as mediaService from '../services/mediaService.js';
const router = express.Router();
router.get('/all', async (req, res, next) => {
    try {
        const mediaFiles = await mediaService.getAllMediaFiles();
        res.json({ success: true, data: mediaFiles });
    }
    catch (error) {
        next(error);
    }
});
router.post('/tag', async (req, res, next) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        const tags = await mediaService.tagImageWithAI(path);
        res.json({ success: true, data: tags });
    }
    catch (error) {
        next(error);
    }
});
router.post('/optimize', async (req, res, next) => {
    try {
        const { path, options = {} } = req.body;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        await mediaService.optimizeImage(path, options);
        res.json({ success: true, message: 'Image optimized successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/find-usage', async (req, res, next) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        const usage = await mediaService.findAssetUsage(path);
        res.json({ success: true, data: usage });
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await mediaService.getMediaStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        next(error);
    }
});
router.get('/unused', async (req, res, next) => {
    try {
        const unusedAssets = await mediaService.detectUnusedAssets();
        res.json({ success: true, data: unusedAssets });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=media.js.map