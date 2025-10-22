export interface DeploymentConfig {
    platform: 'vercel' | 'netlify' | 'aws' | 'github-pages';
    projectName: string;
    buildCommand?: string;
    outputDirectory?: string;
    environmentVariables?: Record<string, string>;
    customDomain?: string;
}
export interface DeploymentStatus {
    id: string;
    status: 'pending' | 'building' | 'deployed' | 'failed';
    url?: string;
    logs?: string[];
    createdAt: Date;
    completedAt?: Date;
}
export interface PlatformInfo {
    name: string;
    supported: boolean;
    installed: boolean;
    version?: string;
}
export declare function deployToVercel(config: DeploymentConfig): Promise<DeploymentStatus>;
export declare function deployToNetlify(config: DeploymentConfig): Promise<DeploymentStatus>;
export declare function deployToAWS(config: DeploymentConfig): Promise<DeploymentStatus>;
export declare function deployToGitHubPages(config: DeploymentConfig): Promise<DeploymentStatus>;
export declare function deployProject(config: DeploymentConfig): Promise<DeploymentStatus>;
export declare function checkPlatformAvailability(): Promise<PlatformInfo[]>;
export declare function detectDeploymentConfig(): Promise<DeploymentConfig | null>;
export declare function getDeploymentHistory(): Promise<DeploymentStatus[]>;
//# sourceMappingURL=deploymentService.d.ts.map