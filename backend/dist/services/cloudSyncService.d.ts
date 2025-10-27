export interface SyncConfig {
    enabled: boolean;
    provider: 'local' | 'github' | 'gitlab' | 'custom';
    repository?: string;
    token?: string;
    branch: string;
    autoSync: boolean;
    syncInterval: number;
    lastSync?: Date;
}
export interface SyncItem {
    id: string;
    type: 'settings' | 'workspace' | 'plugins' | 'themes';
    path: string;
    content: string;
    hash: string;
    lastModified: Date;
    synced: boolean;
}
export interface SyncStatus {
    isOnline: boolean;
    lastSync?: Date;
    pendingChanges: number;
    conflicts: number;
    provider: string;
}
declare class CloudSyncService {
    private config;
    private syncItems;
    private syncInterval;
    private isOnline;
    constructor();
    private initializeSync;
    private loadConfig;
    private saveConfig;
    private loadSyncItems;
    private saveSyncItems;
    enableSync(provider: string, repository?: string, token?: string): Promise<void>;
    disableSync(): Promise<void>;
    updateConfig(config: Partial<SyncConfig>): Promise<void>;
    private startAutoSync;
    private stopAutoSync;
    scanWorkspace(): Promise<void>;
    private scanDirectory;
    private shouldSkipPath;
    private scanSettings;
    private scanPlugins;
    private addSyncItem;
    sync(): Promise<void>;
    private syncWithGitHub;
    private syncWithGitLab;
    private syncWithCustom;
    private syncWithLocal;
    getSyncStatus(): Promise<SyncStatus>;
    getSyncItems(): Promise<SyncItem[]>;
    getConfig(): Promise<SyncConfig>;
    resolveConflict(itemId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void>;
    forceSync(): Promise<void>;
}
export declare const cloudSyncService: CloudSyncService;
export {};
//# sourceMappingURL=cloudSyncService.d.ts.map