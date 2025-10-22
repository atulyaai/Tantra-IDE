import express from 'express';
import * as agentService from '../services/agentService.js';
const router = express.Router();
router.post('/plan', async (req, res, next) => {
    try {
        const { goal, context } = req.body;
        if (!goal) {
            return res.status(400).json({ success: false, error: 'Goal is required' });
        }
        const plan = await agentService.createTaskPlan(goal, context);
        res.json({ success: true, data: plan });
    }
    catch (error) {
        next(error);
    }
});
router.post('/execute-plan', async (req, res, next) => {
    try {
        const { plan } = req.body;
        if (!plan) {
            return res.status(400).json({ success: false, error: 'Plan is required' });
        }
        const executedPlan = await agentService.executeTaskPlan(plan);
        res.json({ success: true, data: executedPlan });
    }
    catch (error) {
        next(error);
    }
});
router.post('/execute-task', async (req, res, next) => {
    try {
        const { task, context } = req.body;
        if (!task) {
            return res.status(400).json({ success: false, error: 'Task is required' });
        }
        const executedTask = await agentService.executeTask(task, context);
        res.json({ success: true, data: executedTask });
    }
    catch (error) {
        next(error);
    }
});
router.get('/plans', async (req, res, next) => {
    try {
        const plans = await agentService.getTaskPlans();
        res.json({ success: true, data: plans });
    }
    catch (error) {
        next(error);
    }
});
router.get('/plans/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await agentService.getTaskPlan(id);
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        res.json({ success: true, data: plan });
    }
    catch (error) {
        next(error);
    }
});
router.post('/plans', async (req, res, next) => {
    try {
        const { plan } = req.body;
        if (!plan) {
            return res.status(400).json({ success: false, error: 'Plan is required' });
        }
        await agentService.saveTaskPlan(plan);
        res.json({ success: true, message: 'Plan saved successfully' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/context', async (req, res, next) => {
    try {
        const context = await agentService.getAgentContext();
        res.json({ success: true, data: context });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=agent.js.map