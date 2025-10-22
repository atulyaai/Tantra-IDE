export interface BundleAnalysis {
    totalSize: number;
    gzippedSize: number;
    files: BundleFile[];
    chunks: BundleChunk[];
    assets: BundleAsset[];
    duplicates: DuplicateModule[];
    recommendations: string[];
}
export interface BundleFile {
    name: string;
    size: number;
    gzippedSize: number;
    type: string;
    path: string;
}
export interface BundleChunk {
    name: string;
    size: number;
    modules: number;
    files: string[];
}
export interface BundleAsset {
    name: string;
    size: number;
    type: string;
    chunks: string[];
}
export interface DuplicateModule {
    name: string;
    instances: number;
    totalSize: number;
    files: string[];
}
export interface PerformanceMetrics {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    totalBlockingTime: number;
}
export interface LighthouseReport {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    metrics: PerformanceMetrics;
    opportunities: OptimizationOpportunity[];
    diagnostics: Diagnostic[];
}
export interface OptimizationOpportunity {
    id: string;
    title: string;
    description: string;
    score: number;
    savings: {
        bytes?: number;
        ms?: number;
    };
}
export interface Diagnostic {
    id: string;
    title: string;
    description: string;
    score: number;
}
export declare function analyzeBundle(): Promise<BundleAnalysis>;
export declare function runPerformanceProfile(url?: string): Promise<LighthouseReport>;
export declare function runMemoryProfile(): Promise<any>;
export declare function runCPUProfile(duration?: number): Promise<any>;
export declare function analyzeNetworkRequests(url?: string): Promise<any>;
export declare function getOptimizationSuggestions(bundleAnalysis: BundleAnalysis, lighthouseReport: LighthouseReport): Promise<string[]>;
export declare function generatePerformanceReport(): Promise<any>;
//# sourceMappingURL=performanceService.d.ts.map