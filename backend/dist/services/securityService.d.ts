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
export declare function scanDependencies(manager?: string): Promise<SecurityScanResult>;
export declare function scanCodeSecurity(): Promise<Vulnerability[]>;
export declare function fixVulnerability(vulnerabilityId: string, manager?: string): Promise<void>;
export declare function getCVEInfo(cveId: string): Promise<any>;
//# sourceMappingURL=securityService.d.ts.map