import express from 'express';
import * as securityService from '../services/securityService.js';
import * as packageService from '../services/packageService.js';
const router = express.Router();
router.post('/scan', async (req, res, next) => {
    try {
        const { type = 'all' } = req.body;
        const manager = await packageService.detectPackageManager();
        let vulnerabilities = [];
        if (type === 'dependencies' || type === 'all') {
            const depResult = await securityService.scanDependencies(manager || 'npm');
            vulnerabilities = [...vulnerabilities, ...depResult.vulnerabilities];
        }
        if (type === 'code' || type === 'all') {
            const codeVulns = await securityService.scanCodeSecurity();
            vulnerabilities = [...vulnerabilities, ...codeVulns];
        }
        res.json({ success: true, data: vulnerabilities });
    }
    catch (error) {
        next(error);
    }
});
router.post('/fix', async (req, res, next) => {
    try {
        const { vulnerabilityId, manager = 'npm' } = req.body;
        if (!vulnerabilityId) {
            return res.status(400).json({ success: false, error: 'Vulnerability ID is required' });
        }
        await securityService.fixVulnerability(vulnerabilityId, manager);
        res.json({ success: true, message: 'Vulnerability fix attempted' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/cve/:cveId', async (req, res, next) => {
    try {
        const { cveId } = req.params;
        const cveInfo = await securityService.getCVEInfo(cveId);
        res.json({ success: true, data: cveInfo });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=security.js.map