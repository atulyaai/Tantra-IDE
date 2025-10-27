import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

export interface SyncConfig {
  enabled: boolean;
  provider: 'local' | 'github' | 'gitlab' | 'custom';
  repository?: string;
  token?: string;
  branch: string;
  autoSync: boolean;
  syncInterval: number; // in minutes
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

class CloudSyncService {
  private config: SyncConfig;
  private syncItems: Map<string, SyncItem> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = false;

  constructor() {
    this.config = {
      enabled: false,
      provider: 'local',
      branch: 'main',
      autoSync: true,
      syncInterval: 5,
    };
    
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    try {
      await this.loadConfig();
      await this.loadSyncItems();
      
      if (this.config.enabled && this.config.autoSync) {
        this.startAutoSync();
      }
    } catch (error) {
      console.error('[CloudSync] Initialization error:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.tantra', 'sync-config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(configData) };
    } catch (error) {
      // Config doesn't exist, use defaults
      await this.saveConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const configDir = path.join(process.cwd(), '.tantra');
      await fs.mkdir(configDir, { recursive: true });
      
      const configPath = path.join(configDir, 'sync-config.json');
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('[CloudSync] Failed to save config:', error);
    }
  }

  private async loadSyncItems(): Promise<void> {
    try {
      const itemsPath = path.join(process.cwd(), '.tantra', 'sync-items.json');
      const itemsData = await fs.readFile(itemsPath, 'utf-8');
      const items: SyncItem[] = JSON.parse(itemsData);
      
      this.syncItems.clear();
      for (const item of items) {
        this.syncItems.set(item.id, item);
      }
    } catch (error) {
      // Items don't exist, start fresh
      await this.scanWorkspace();
    }
  }

  private async saveSyncItems(): Promise<void> {
    try {
      const itemsPath = path.join(process.cwd(), '.tantra', 'sync-items.json');
      const items = Array.from(this.syncItems.values());
      await fs.writeFile(itemsPath, JSON.stringify(items, null, 2));
    } catch (error) {
      console.error('[CloudSync] Failed to save sync items:', error);
    }
  }

  async enableSync(provider: string, repository?: string, token?: string): Promise<void> {
    this.config.enabled = true;
    this.config.provider = provider as any;
    this.config.repository = repository;
    this.config.token = token;
    
    await this.saveConfig();
    await this.scanWorkspace();
    
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  async disableSync(): Promise<void> {
    this.config.enabled = false;
    await this.saveConfig();
    this.stopAutoSync();
  }

  async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    
    if (this.config.enabled && this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('[CloudSync] Auto sync error:', error);
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async scanWorkspace(): Promise<void> {
    try {
      const workspacePath = process.cwd();
      await this.scanDirectory(workspacePath, 'workspace');
      
      // Scan settings
      await this.scanSettings();
      
      // Scan plugins
      await this.scanPlugins();
      
      await this.saveSyncItems();
    } catch (error) {
      console.error('[CloudSync] Workspace scan error:', error);
    }
  }

  private async scanDirectory(dirPath: string, type: 'workspace' | 'settings' | 'plugins'): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip certain directories and files
        if (this.shouldSkipPath(fullPath)) continue;
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, type);
        } else if (entry.isFile()) {
          await this.addSyncItem(fullPath, type);
        }
      }
    } catch (error) {
      console.error(`[CloudSync] Error scanning directory ${dirPath}:`, error);
    }
  }

  private shouldSkipPath(filePath: string): boolean {
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

  private async scanSettings(): Promise<void> {
    try {
      const settingsPath = path.join(process.cwd(), '.tantra', 'settings.json');
      await this.addSyncItem(settingsPath, 'settings');
    } catch (error) {
      // Settings file doesn't exist yet
    }
  }

  private async scanPlugins(): Promise<void> {
    try {
      const pluginsPath = path.join(process.cwd(), 'plugins');
      await this.scanDirectory(pluginsPath, 'plugins');
    } catch (error) {
      // Plugins directory doesn't exist yet
    }
  }

  private async addSyncItem(filePath: string, type: 'workspace' | 'settings' | 'plugins' | 'themes'): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      const item: SyncItem = {
        id: crypto.createHash('md5').update(filePath).digest('hex'),
        type,
        path: filePath,
        content,
        hash,
        lastModified: stats.mtime,
        synced: false,
      };
      
      this.syncItems.set(item.id, item);
    } catch (error) {
      console.error(`[CloudSync] Error adding sync item ${filePath}:`, error);
    }
  }

  async sync(): Promise<void> {
    if (!this.config.enabled) return;
    
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
      
    } catch (error) {
      console.error('[CloudSync] Sync error:', error);
      this.isOnline = false;
    }
  }

  private async syncWithGitHub(): Promise<void> {
    if (!this.config.repository || !this.config.token) {
      throw new Error('GitHub repository and token are required');
    }
    
    // This would implement GitHub API integration
    console.log('[CloudSync] Syncing with GitHub...');
  }

  private async syncWithGitLab(): Promise<void> {
    if (!this.config.repository || !this.config.token) {
      throw new Error('GitLab repository and token are required');
    }
    
    // This would implement GitLab API integration
    console.log('[CloudSync] Syncing with GitLab...');
  }

  private async syncWithCustom(): Promise<void> {
    // This would implement custom sync provider
    console.log('[CloudSync] Syncing with custom provider...');
  }

  private async syncWithLocal(): Promise<void> {
    // Local sync - just save items
    await this.saveSyncItems();
    console.log('[CloudSync] Local sync completed');
  }

  async getSyncStatus(): Promise<SyncStatus> {
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

  async getSyncItems(): Promise<SyncItem[]> {
    return Array.from(this.syncItems.values());
  }

  async getConfig(): Promise<SyncConfig> {
    return { ...this.config };
  }

  async resolveConflict(itemId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const item = this.syncItems.get(itemId);
    if (!item) return;
    
    // This would implement conflict resolution
    console.log(`[CloudSync] Resolving conflict for ${itemId} with resolution: ${resolution}`);
  }

  async forceSync(): Promise<void> {
    await this.scanWorkspace();
    await this.sync();
  }
}

export const cloudSyncService = new CloudSyncService();