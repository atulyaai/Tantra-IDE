import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
class CloudSyncService {
    constructor() {
        this.syncItems = new Map();
        this.syncInterval = null;
        this.isOnline = false;
        this.config = {
            enabled: false,
            provider: 'local',
            branch: 'main',
            autoSync: true,
            syncInterval: 5,
        };
        this.initializeSync();
    }
    async initializeSync() {
        try {
            await this.loadConfig();
            await this.loadSyncItems();
            if (this.config.enabled && this.config.autoSync) {
                this.startAutoSync();
            }
        }
        catch (error) {
            console.error('[CloudSync] Initialization error:', error);
        }
    }
    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), '.tantra', 'sync-config.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            this.config = { ...this.config, ...JSON.parse(configData) };
        }
        catch (error) {
            // Config doesn't exist, use defaults
            await this.saveConfig();
        }
    }
    async saveConfig() {
        try {
            const configDir = path.join(process.cwd(), '.tantra');
            await fs.mkdir(configDir, { recursive: true });
            const configPath = path.join(configDir, 'sync-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error('[CloudSync] Failed to save config:', error);
        }
    }
    async loadSyncItems() {
        try {
            const itemsPath = path.join(process.cwd(), '.tantra', 'sync-items.json');
            const itemsData = await fs.readFile(itemsPath, 'utf-8');
            const items = JSON.parse(itemsData);
            this.syncItems.clear();
            for (const item of items) {
                this.syncItems.set(item.id, item);
            }
        }
        catch (error) {
            // Items don't exist, start fresh
            await this.scanWorkspace();
        }
    }
    async saveSyncItems() {
        try {
            const itemsPath = path.join(process.cwd(), '.tantra', 'sync-items.json');
            const items = Array.from(this.syncItems.values());
            await fs.writeFile(itemsPath, JSON.stringify(items, null, 2));
        }
        catch (error) {
            console.error('[CloudSync] Failed to save sync items:', error);
        }
    }
    async enableSync(provider, repository, token) {
        this.config.enabled = true;
        this.config.provider = provider;
        this.config.repository = repository;
        this.config.token = token;
        await this.saveConfig();
        await this.scanWorkspace();
        if (this.config.autoSync) {
            this.startAutoSync();
        }
    }
    async disableSync() {
        this.config.enabled = false;
        await this.saveConfig();
        this.stopAutoSync();
    }
    async updateConfig(config) {
        this.config = { ...this.config, ...config };
        await this.saveConfig();
        if (this.config.enabled && this.config.autoSync) {
            this.startAutoSync();
        }
        else {
            this.stopAutoSync();
        }
    }
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(async () => {
            try {
                await this.sync();
            }
            catch (error) {
                console.error('[CloudSync] Auto sync error:', error);
            }
        }, this.config.syncInterval * 60 * 1000);
    }
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    async scanWorkspace() {
        try {
            const workspacePath = process.cwd();
            await this.scanDirectory(workspacePath, 'workspace');
            // Scan settings
            await this.scanSettings();
            // Scan plugins
            await this.scanPlugins();
            await this.saveSyncItems();
        }
        catch (error) {
            console.error('[CloudSync] Workspace scan error:', error);
        }
    }
    async scanDirectory(dirPath, type) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                // Skip certain directories and files
                if (this.shouldSkipPath(fullPath))
                    continue;
                if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath, type);
                }
                else if (entry.isFile()) {
                    await this.addSyncItem(fullPath, type);
                }
            }
        }
        catch (error) {
            console.error(`[CloudSync] Error scanning directory ${dirPath}:`, error);
        }
    }
    shouldSkipPath(filePath) {
        const skipPatterns = [
            'node_modules',
            '.git',
            '.tantra',
            'dist',
            'build',
            '.next',
            '.vscode',
            'coverage',
            '.nyc_output',
            '*.log',
            '*.tmp',
            '.DS_Store',
        ];
        return skipPatterns.some(pattern => {
            if (pattern.includes('*')) {
                return filePath.includes(pattern.replace('*', ''));
            }
            return filePath.includes(pattern);
        });
    }
    async scanSettings() {
        try {
            const settingsPath = path.join(process.cwd(), '.tantra', 'settings.json');
            await this.addSyncItem(settingsPath, 'settings');
        }
        catch (error) {
            // Settings file doesn't exist yet
        }
    }
    async scanPlugins() {
        try {
            const pluginsPath = path.join(process.cwd(), 'plugins');
            await this.scanDirectory(pluginsPath, 'plugins');
        }
        catch (error) {
            // Plugins directory doesn't exist yet
        }
    }
    async addSyncItem(filePath, type) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const hash = crypto.createHash('md5').update(content).digest('hex');
            const item = {
                id: crypto.createHash('md5').update(filePath).digest('hex'),
                type,
                path: filePath,
                content,
                hash,
                lastModified: stats.mtime,
                synced: false,
            };
            this.syncItems.set(item.id, item);
        }
        catch (error) {
            console.error(`[CloudSync] Error adding sync item ${filePath}:`, error);
        }
    }
    async sync() {
        if (!this.config.enabled)
            return;
        try {
            this.isOnline = true;
            // Scan for changes
            await this.scanWorkspace();
            // Sync based on provider
            switch (this.config.provider) {
                case 'github':
                    await this.syncWithGitHub();
                    break;
                case 'gitlab':
                    await this.syncWithGitLab();
                    break;
                case 'custom':
                    await this.syncWithCustom();
                    break;
                default:
                    await this.syncWithLocal();
            }
            this.config.lastSync = new Date();
            await this.saveConfig();
        }
        catch (error) {
            console.error('[CloudSync] Sync error:', error);
            this.isOnline = false;
        }
    }
    async syncWithGitHub() {
        if (!this.config.repository || !this.config.token) {
            throw new Error('GitHub repository and token are required');
        }
        // This would implement GitHub API integration
        console.log('[CloudSync] Syncing with GitHub...');
    }
    async syncWithGitLab() {
        if (!this.config.repository || !this.config.token) {
            throw new Error('GitLab repository and token are required');
        }
        // This would implement GitLab API integration
        console.log('[CloudSync] Syncing with GitLab...');
    }
    async syncWithCustom() {
        // This would implement custom sync provider
        console.log('[CloudSync] Syncing with custom provider...');
    }
    async syncWithLocal() {
        // Local sync - just save items
        await this.saveSyncItems();
        console.log('[CloudSync] Local sync completed');
    }
    async getSyncStatus() {
        const pendingChanges = Array.from(this.syncItems.values()).filter(item => !item.synced).length;
        const conflicts = 0; // This would be calculated based on conflicts
        return {
            isOnline: this.isOnline,
            lastSync: this.config.lastSync,
            pendingChanges,
            conflicts,
            provider: this.config.provider,
        };
    }
    async getSyncItems() {
        return Array.from(this.syncItems.values());
    }
    async getConfig() {
        return { ...this.config };
    }
    async resolveConflict(itemId, resolution) {
        const item = this.syncItems.get(itemId);
        if (!item)
            return;
        // This would implement conflict resolution
        console.log(`[CloudSync] Resolving conflict for ${itemId} with resolution: ${resolution}`);
    }
    async forceSync() {
        await this.scanWorkspace();
        await this.sync();
    }
}
export const cloudSyncService = new CloudSyncService();
//# sourceMappingURL=cloudSyncService.js.map