export interface PackageInfo {
    name: string;
    version: string;
    description?: string;
    latest?: string;
    outdated: boolean;
    dependencies?: Record<string, string>;
}
export interface DependencyTree {
    name: string;
    version: string;
    dependencies: DependencyTree[];
}
export declare function detectPackageManager(): Promise<string | null>;
export declare function detectMissingDependencies(): Promise<string[]>;
export declare function installPackage(packageName: string, manager?: string): Promise<void>;
export declare function getDependencyTree(manager?: string): Promise<DependencyTree | null>;
export declare function updatePackages(manager?: string): Promise<void>;
//# sourceMappingURL=packageService.d.ts.map