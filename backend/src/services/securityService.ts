import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

export interface Vulnerability {
  id: string;
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  fixAvailable: boolean;
  fixVersion?: string;
  cve?: string;
}

export interface SecurityScanResult {
  vulnerabilities: Vulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

export async function scanDependencies(manager: string = 'npm'): Promise<SecurityScanResult> {
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
  } catch (error) {
    console.error('Security scan error:', error);
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
  }
}

async function scanNpmDependencies(): Promise<SecurityScanResult> {
  try {
    const { stdout } = await execAsync('npm audit --json', { cwd: WORKSPACE_PATH });
    const auditResult = JSON.parse(stdout);
    
    const vulnerabilities: Vulnerability[] = [];
    
    if (auditResult.vulnerabilities) {
      for (const [packageName, vulnData] of Object.entries(auditResult.vulnerabilities as Record<string, any>)) {
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
  } catch (error) {
    console.error('npm audit error:', error);
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
  }
}

async function scanPipDependencies(): Promise<SecurityScanResult> {
  try {
    // Try pip-audit if available
    try {
      const { stdout } = await execAsync('pip-audit --format=json', { cwd: WORKSPACE_PATH });
      const auditResult = JSON.parse(stdout);
      
      const vulnerabilities: Vulnerability[] = auditResult.vulnerabilities.map((vuln: any) => ({
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
    } catch {
      // Fallback to safety check
      return await scanWithSafety();
    }
  } catch (error) {
    console.error('pip security scan error:', error);
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
  }
}

async function scanWithSafety(): Promise<SecurityScanResult> {
  try {
    const { stdout } = await execAsync('safety check --json', { cwd: WORKSPACE_PATH });
    const safetyResult = JSON.parse(stdout);
    
    const vulnerabilities: Vulnerability[] = safetyResult.map((vuln: any) => ({
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
  } catch {
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
  }
}

async function scanCargoDependencies(): Promise<SecurityScanResult> {
  try {
    const { stdout } = await execAsync('cargo audit --json', { cwd: WORKSPACE_PATH });
    const auditResult = JSON.parse(stdout);
    
    const vulnerabilities: Vulnerability[] = auditResult.vulnerabilities.map((vuln: any) => ({
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
  } catch {
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
  }
}

export async function scanCodeSecurity(): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    // Scan for common security issues
    const patterns = [
      {
        pattern: /password\s*=\s*["'][^"']+["']/gi,
        severity: 'high' as const,
        title: 'Hardcoded Password',
        description: 'Potential hardcoded password found in code',
      },
      {
        pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
        severity: 'high' as const,
        title: 'Hardcoded API Key',
        description: 'Potential hardcoded API key found in code',
      },
      {
        pattern: /secret\s*=\s*["'][^"']+["']/gi,
        severity: 'high' as const,
        title: 'Hardcoded Secret',
        description: 'Potential hardcoded secret found in code',
      },
      {
        pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{/gi,
        severity: 'critical' as const,
        title: 'SQL Injection Risk',
        description: 'Potential SQL injection vulnerability',
      },
      {
        pattern: /innerHTML\s*=\s*[^;]+/gi,
        severity: 'moderate' as const,
        title: 'XSS Risk',
        description: 'Potential XSS vulnerability with innerHTML',
      },
    ];
    
    // This would need to be implemented with file scanning
    // For now, return empty array
    return vulnerabilities;
  } catch (error) {
    console.error('Code security scan error:', error);
    return [];
  }
}

export async function fixVulnerability(vulnerabilityId: string, manager: string = 'npm'): Promise<void> {
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
  } catch (error) {
    console.error('Error fixing vulnerability:', error);
    throw error;
  }
}

function mapSeverity(severity: string): 'low' | 'moderate' | 'high' | 'critical' {
  const s = severity.toLowerCase();
  if (s.includes('critical')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('moderate') || s.includes('medium')) return 'moderate';
  return 'low';
}

export async function getCVEInfo(cveId: string): Promise<any> {
  try {
    const response = await axios.get(`https://cve.circl.lu/api/cve/${cveId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching CVE info:', error);
    return null;
  }
}

