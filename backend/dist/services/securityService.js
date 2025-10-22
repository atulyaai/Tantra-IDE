import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
const execAsync = promisify(exec);
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();
export async function scanDependencies(manager = 'npm') {
    try {
        switch (manager) {
            case 'npm':
                return await scanNpmDependencies();
            case 'pip':
                return await scanPipDependencies();
            case 'cargo':
                return await scanCargoDependencies();
            default:
                return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
        }
    }
    catch (error) {
        console.error('Security scan error:', error);
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    }
}
async function scanNpmDependencies() {
    try {
        const { stdout } = await execAsync('npm audit --json', { cwd: WORKSPACE_PATH });
        const auditResult = JSON.parse(stdout);
        const vulnerabilities = [];
        if (auditResult.vulnerabilities) {
            for (const [packageName, vulnData] of Object.entries(auditResult.vulnerabilities)) {
                for (const vuln of vulnData.via) {
                    if (typeof vuln === 'object' && vuln.title) {
                        vulnerabilities.push({
                            id: vuln.id || `${packageName}-${vuln.title}`,
                            package: packageName,
                            severity: mapSeverity(vuln.severity),
                            title: vuln.title,
                            description: vuln.description || '',
                            fixAvailable: vulnData.fixAvailable || false,
                            fixVersion: vulnData.fixAvailable?.version,
                            cve: vuln.cve,
                        });
                    }
                }
            }
        }
        return {
            vulnerabilities,
            summary: {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length,
            },
        };
    }
    catch (error) {
        console.error('npm audit error:', error);
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    }
}
async function scanPipDependencies() {
    try {
        // Try pip-audit if available
        try {
            const { stdout } = await execAsync('pip-audit --format=json', { cwd: WORKSPACE_PATH });
            const auditResult = JSON.parse(stdout);
            const vulnerabilities = auditResult.vulnerabilities.map((vuln) => ({
                id: vuln.id,
                package: vuln.package,
                severity: mapSeverity(vuln.severity),
                title: vuln.summary,
                description: vuln.description || '',
                fixAvailable: vuln.fix_versions && vuln.fix_versions.length > 0,
                fixVersion: vuln.fix_versions?.[0],
                cve: vuln.id,
            }));
            return {
                vulnerabilities,
                summary: {
                    total: vulnerabilities.length,
                    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                    high: vulnerabilities.filter(v => v.severity === 'high').length,
                    moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
                    low: vulnerabilities.filter(v => v.severity === 'low').length,
                },
            };
        }
        catch {
            // Fallback to safety check
            return await scanWithSafety();
        }
    }
    catch (error) {
        console.error('pip security scan error:', error);
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    }
}
async function scanWithSafety() {
    try {
        const { stdout } = await execAsync('safety check --json', { cwd: WORKSPACE_PATH });
        const safetyResult = JSON.parse(stdout);
        const vulnerabilities = safetyResult.map((vuln) => ({
            id: vuln.id,
            package: vuln.package,
            severity: mapSeverity(vuln.severity),
            title: vuln.advisory,
            description: vuln.description || '',
            fixAvailable: vuln.specs && vuln.specs.length > 0,
            fixVersion: vuln.specs?.[0],
        }));
        return {
            vulnerabilities,
            summary: {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length,
            },
        };
    }
    catch {
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    }
}
async function scanCargoDependencies() {
    try {
        const { stdout } = await execAsync('cargo audit --json', { cwd: WORKSPACE_PATH });
        const auditResult = JSON.parse(stdout);
        const vulnerabilities = auditResult.vulnerabilities.map((vuln) => ({
            id: vuln.id,
            package: vuln.package.name,
            severity: mapSeverity(vuln.severity),
            title: vuln.title,
            description: vuln.description || '',
            fixAvailable: vuln.versions && vuln.versions.length > 0,
            fixVersion: vuln.versions?.[0],
            cve: vuln.id,
        }));
        return {
            vulnerabilities,
            summary: {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length,
            },
        };
    }
    catch {
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    }
}
export async function scanCodeSecurity() {
    const vulnerabilities = [];
    try {
        // Scan for common security issues
        const patterns = [
            {
                pattern: /password\s*=\s*["'][^"']+["']/gi,
                severity: 'high',
                title: 'Hardcoded Password',
                description: 'Potential hardcoded password found in code',
            },
            {
                pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
                severity: 'high',
                title: 'Hardcoded API Key',
                description: 'Potential hardcoded API key found in code',
            },
            {
                pattern: /secret\s*=\s*["'][^"']+["']/gi,
                severity: 'high',
                title: 'Hardcoded Secret',
                description: 'Potential hardcoded secret found in code',
            },
            {
                pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{/gi,
                severity: 'critical',
                title: 'SQL Injection Risk',
                description: 'Potential SQL injection vulnerability',
            },
            {
                pattern: /innerHTML\s*=\s*[^;]+/gi,
                severity: 'moderate',
                title: 'XSS Risk',
                description: 'Potential XSS vulnerability with innerHTML',
            },
        ];
        // This would need to be implemented with file scanning
        // For now, return empty array
        return vulnerabilities;
    }
    catch (error) {
        console.error('Code security scan error:', error);
        return [];
    }
}
export async function fixVulnerability(vulnerabilityId, manager = 'npm') {
    try {
        switch (manager) {
            case 'npm':
                await execAsync('npm audit fix', { cwd: WORKSPACE_PATH });
                break;
            case 'pip':
                await execAsync('pip install --upgrade pip', { cwd: WORKSPACE_PATH });
                break;
            case 'cargo':
                await execAsync('cargo update', { cwd: WORKSPACE_PATH });
                break;
            default:
                throw new Error(`Unsupported package manager: ${manager}`);
        }
    }
    catch (error) {
        console.error('Error fixing vulnerability:', error);
        throw error;
    }
}
function mapSeverity(severity) {
    const s = severity.toLowerCase();
    if (s.includes('critical'))
        return 'critical';
    if (s.includes('high'))
        return 'high';
    if (s.includes('moderate') || s.includes('medium'))
        return 'moderate';
    return 'low';
}
export async function getCVEInfo(cveId) {
    try {
        const response = await axios.get(`https://cve.circl.lu/api/cve/${cveId}`);
        return response.data;
    }
    catch (error) {
        console.error('Error fetching CVE info:', error);
        return null;
    }
}
//# sourceMappingURL=securityService.js.map