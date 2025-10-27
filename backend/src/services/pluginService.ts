import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  path: string;
  manifest: PluginManifest;
  dependencies: string[];
  commands: PluginCommand[];
  keybindings: PluginKeybinding[];
  views: PluginView[];
  languages: PluginLanguage[];
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  commands?: PluginCommand[];
  keybindings?: PluginKeybinding[];
  views?: PluginView[];
  languages?: PluginLanguage[];
  activationEvents?: string[];
}

export interface PluginCommand {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  handler: string;
}

export interface PluginKeybinding {
  key: string;
  command: string;
  when?: string;
}

export interface PluginView {
  id: string;
  name: string;
  type: 'panel' | 'sidebar' | 'statusbar';
  location: string;
  component: string;
}

export interface PluginLanguage {
  id: string;
  extensions: string[];
  configuration?: any;
}

export interface PluginContext {
  workspace: string;
  files: string[];
  activeFile?: string;
  selection?: string;
  clipboard?: string;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDir: string;
  private loadedPlugins: Map<string, any> = new Map();

  constructor() {
    this.pluginDir = path.join(process.cwd(), 'plugins');
    this.initializePluginDirectory();
  }

  private async initializePluginDirectory() {
    try {
      await fs.mkdir(this.pluginDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create plugin directory:', error);
    }
  }

  async loadPlugin(pluginPath: string): Promise<Plugin> {
    try {
      const manifestPath = path.join(pluginPath, 'package.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      const plugin: Plugin = {
        id: manifest.name,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled: true,
        path: pluginPath,
        manifest,
        dependencies: Object.keys(manifest.dependencies || {}),
        commands: manifest.commands || [],
        keybindings: manifest.keybindings || [],
        views: manifest.views || [],
        languages: manifest.languages || [],
      };

      // Load the plugin module
      const pluginModule = await import(path.join(pluginPath, manifest.main));
      this.loadedPlugins.set(plugin.id, pluginModule);

      this.plugins.set(plugin.id, plugin);
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  async loadAllPlugins(): Promise<Plugin[]> {
    try {
      const entries = await fs.readdir(this.pluginDir, { withFileTypes: true });
      const pluginDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(this.pluginDir, entry.name));

      const plugins: Plugin[] = [];
      for (const pluginDir of pluginDirs) {
        try {
          const plugin = await this.loadPlugin(pluginDir);
          plugins.push(plugin);
        } catch (error) {
          console.error(`Failed to load plugin from ${pluginDir}:`, error);
        }
      }

      return plugins;
    } catch (error) {
      console.error('Failed to load plugins:', error);
      return [];
    }
  }

  async installPlugin(packageName: string, version?: string): Promise<Plugin> {
    try {
      const installCommand = version 
        ? `npm install ${packageName}@${version}`
        : `npm install ${packageName}`;

      // Install to plugin directory
      await execAsync(installCommand, { cwd: this.pluginDir });

      // Find the installed plugin
      const pluginPath = path.join(this.pluginDir, 'node_modules', packageName);
      const plugin = await this.loadPlugin(pluginPath);

      return plugin;
    } catch (error) {
      console.error(`Failed to install plugin ${packageName}:`, error);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Remove from node_modules
      const pluginPath = path.join(this.pluginDir, 'node_modules', pluginId);
      await fs.rm(pluginPath, { recursive: true, force: true });

      // Remove from loaded plugins
      this.plugins.delete(pluginId);
      this.loadedPlugins.delete(pluginId);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
      await this.activatePlugin(pluginId);
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      await this.deactivatePlugin(pluginId);
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const pluginModule = this.loadedPlugins.get(pluginId);

    if (plugin && pluginModule && plugin.enabled) {
      try {
        if (pluginModule.activate) {
          await pluginModule.activate();
        }
      } catch (error) {
        console.error(`Failed to activate plugin ${pluginId}:`, error);
      }
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const pluginModule = this.loadedPlugins.get(pluginId);

    if (pluginModule) {
      try {
        if (pluginModule.deactivate) {
          await pluginModule.deactivate();
        }
      } catch (error) {
        console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      }
    }
  }

  async executeCommand(command: string, context: PluginContext): Promise<any> {
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled) continue;

      const commandDef = plugin.commands.find(cmd => cmd.command === command);
      if (commandDef) {
        const pluginModule = this.loadedPlugins.get(plugin.id);
        if (pluginModule && pluginModule[commandDef.handler]) {
          return await pluginModule[commandDef.handler](context);
        }
      }
    }

    throw new Error(`Command ${command} not found`);
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getCommands(): PluginCommand[] {
    const commands: PluginCommand[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        commands.push(...plugin.commands);
      }
    }
    return commands;
  }

  getKeybindings(): PluginKeybinding[] {
    const keybindings: PluginKeybinding[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        keybindings.push(...plugin.keybindings);
      }
    }
    return keybindings;
  }

  getViews(): PluginView[] {
    const views: PluginView[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        views.push(...plugin.views);
      }
    }
    return views;
  }

  getLanguages(): PluginLanguage[] {
    const languages: PluginLanguage[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        languages.push(...plugin.languages);
      }
    }
    return languages;
  }
}

export const pluginManager = new PluginManager();