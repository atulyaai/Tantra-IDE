import express from 'express';
import { voiceService } from '../services/voiceService.js';
const router = express.Router();
// Start voice listening
router.post('/start', async (req, res, next) => {
    try {
        const session = await voiceService.startListening();
        res.json({ success: true, data: session });
    }
    catch (error) {
        next(error);
    }
});
// Stop voice listening
router.post('/stop', async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        await voiceService.stopListening(sessionId);
        res.json({ success: true, message: 'Voice listening stopped' });
    }
    catch (error) {
        next(error);
    }
});
// Process voice command
router.post('/command', async (req, res, next) => {
    try {
        const { sessionId, transcript } = req.body;
        if (!sessionId || !transcript) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and transcript are required'
            });
        }
        await voiceService.processVoiceCommand(sessionId, transcript);
        res.json({ success: true, message: 'Command processed' });
    }
    catch (error) {
        next(error);
    }
});
// Get voice configuration
router.get('/config', async (req, res, next) => {
    try {
        const config = voiceService.getConfig();
        res.json({ success: true, data: config });
    }
    catch (error) {
        next(error);
    }
});
// Update voice configuration
router.put('/config', async (req, res, next) => {
    try {
        const config = req.body;
        await voiceService.updateConfig(config);
        res.json({ success: true, message: 'Configuration updated' });
    }
    catch (error) {
        next(error);
    }
});
// Add voice command
router.post('/commands', async (req, res, next) => {
    try {
        const command = req.body;
        await voiceService.addCommand(command);
        res.json({ success: true, message: 'Command added' });
    }
    catch (error) {
        next(error);
    }
});
// Remove voice command
router.delete('/commands/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await voiceService.removeCommand(id);
        res.json({ success: true, message: 'Command removed' });
    }
    catch (error) {
        next(error);
    }
});
// Get active sessions
router.get('/sessions', async (req, res, next) => {
    try {
        const sessions = voiceService.getSessions();
        res.json({ success: true, data: sessions });
    }
    catch (error) {
        next(error);
    }
});
// Get current session
router.get('/sessions/current', async (req, res, next) => {
    try {
        const session = voiceService.getCurrentSession();
        res.json({ success: true, data: session });
    }
    catch (error) {
        next(error);
    }
});
// Check if voice is active
router.get('/status', async (req, res, next) => {
    try {
        const isActive = voiceService.isVoiceActive();
        res.json({ success: true, data: { isActive } });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=voice.js.map