import express from 'express';
import * as fileService from '../services/fileService.js';
const router = express.Router();
// Get file tree
router.get('/tree', async (req, res, next) => {
    try {
        const path = req.query.path || '.';
        const tree = await fileService.getFileTree(path);
        res.json({ success: true, data: tree });
    }
    catch (error) {
        next(error);
    }
});
// Read file
router.get('/read', async (req, res, next) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        const content = await fileService.readFile(path);
        res.json({ success: true, data: { path, content } });
    }
    catch (error) {
        next(error);
    }
});
// Write file
router.post('/write', async (req, res, next) => {
    try {
        const { path, content } = req.body;
        if (!path || content === undefined) {
            return res.status(400).json({ success: false, error: 'Path and content are required' });
        }
        await fileService.writeFile(path, content);
        res.json({ success: true, message: 'File saved successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Create file
router.post('/create', async (req, res, next) => {
    try {
        const { path, content = '' } = req.body;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        await fileService.createFile(path, content);
        res.json({ success: true, message: 'File created successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Delete file
router.delete('/delete', async (req, res, next) => {
    try {
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        await fileService.deleteFile(path);
        res.json({ success: true, message: 'File deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Rename file
router.post('/rename', async (req, res, next) => {
    try {
        const { oldPath, newPath } = req.body;
        if (!oldPath || !newPath) {
            return res.status(400).json({ success: false, error: 'Old and new paths are required' });
        }
        await fileService.renameFile(oldPath, newPath);
        res.json({ success: true, message: 'File renamed successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Create folder
router.post('/create-folder', async (req, res, next) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ success: false, error: 'Path is required' });
        }
        await fileService.createFolder(path);
        res.json({ success: true, message: 'Folder created successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Search files
router.get('/search', async (req, res, next) => {
    try {
        const pattern = req.query.pattern;
        const path = req.query.path || '.';
        if (!pattern) {
            return res.status(400).json({ success: false, error: 'Pattern is required' });
        }
        const results = await fileService.searchFiles(pattern, path);
        res.json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=files.js.map