export interface GitChange {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict' | null;
    diff?: string;
}
export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}
export declare function getGitStatus(): Promise<GitChange[]>;
export declare function getGitDiff(filePath?: string): Promise<string>;
export declare function commitChanges(message: string, files?: string[]): Promise<void>;
export declare function pushChanges(remote?: string, branch?: string): Promise<void>;
export declare function pullChanges(remote?: string, branch?: string): Promise<void>;
export declare function getCurrentBranch(): Promise<string>;
export declare function getGitHistory(limit?: number): Promise<GitCommit[]>;
export declare function createBranch(branchName: string): Promise<void>;
export declare function switchBranch(branchName: string): Promise<void>;
export declare function getBranches(): Promise<string[]>;
export declare function isGitRepository(): Promise<boolean>;
//# sourceMappingURL=gitService.d.ts.map