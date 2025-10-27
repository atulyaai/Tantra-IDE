import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
const execAsync = promisify(exec);
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.loadedPlugins = new Map();
        this.pluginDir = path.join(process.cwd(), 'plugins');
        this.initializePluginDirectory();
    }
    async initializePluginDirectory() {
        try {
            await fs.mkdir(this.pluginDir, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create plugin directory:', error);
        }
    }
    async loadPlugin(pluginPath) {
        try {
            const manifestPath = path.join(pluginPath, 'package.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            const plugin = {
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
        }
        catch (error) {
            console.error(`Failed to load plugin from ${pluginPath}:`, error);
            throw error;
        }
    }
    async loadAllPlugins() {
        try {
            const entries = await fs.readdir(this.pluginDir, { withFileTypes: true });
            const pluginDirs = entries
                .filter(entry => entry.isDirectory())
                .map(entry => path.join(this.pluginDir, entry.name));
            const plugins = [];
            for (const pluginDir of pluginDirs) {
                try {
                    const plugin = await this.loadPlugin(pluginDir);
                    plugins.push(plugin);
                }
                catch (error) {
                    console.error(`Failed to load plugin from ${pluginDir}:`, error);
                }
            }
            return plugins;
        }
        catch (error) {
            console.error('Failed to load plugins:', error);
            return [];
        }
    }
    async installPlugin(packageName, version) {
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
        }
        catch (error) {
            console.error(`Failed to install plugin ${packageName}:`, error);
            throw error;
        }
    }
    async uninstallPlugin(pluginId) {
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
        }
        catch (error) {
            console.error(`Failed to uninstall plugin ${pluginId}:`, error);
            throw error;
        }
    }
    async enablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.enabled = true;
            await this.activatePlugin(pluginId);
        }
    }
    async disablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.enabled = false;
            await this.deactivatePlugin(pluginId);
        }
    }
    async activatePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        const pluginModule = this.loadedPlugins.get(pluginId);
        if (plugin && pluginModule && plugin.enabled) {
            try {
                if (pluginModule.activate) {
                    await pluginModule.activate();
                }
            }
            catch (error) {
                console.error(`Failed to activate plugin ${pluginId}:`, error);
            }
        }
    }
    async deactivatePlugin(pluginId) {
        const pluginModule = this.loadedPlugins.get(pluginId);
        if (pluginModule) {
            try {
                if (pluginModule.deactivate) {
                    await pluginModule.deactivate();
                }
            }
            catch (error) {
                console.error(`Failed to deactivate plugin ${pluginId}:`, error);
            }
        }
    }
    async executeCommand(command, context) {
        for (const plugin of this.plugins.values()) {
            if (!plugin.enabled)
                continue;
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
    getPlugins() {
        return Array.from(this.plugins.values());
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getCommands() {
        const commands = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                commands.push(...plugin.commands);
            }
        }
        return commands;
    }
    getKeybindings() {
        const keybindings = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                keybindings.push(...plugin.keybindings);
            }
        }
        return keybindings;
    }
    getViews() {
        const views = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                views.push(...plugin.views);
            }
        }
        return views;
    }
    getLanguages() {
        const languages = [];
        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                languages.push(...plugin.languages);
            }
        }
        return languages;
    }
}
export const pluginManager = new PluginManager();
//# sourceMappingURL=pluginService.js.map