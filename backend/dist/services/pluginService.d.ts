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
declare class PluginManager {
    private plugins;
    private pluginDir;
    private loadedPlugins;
    constructor();
    private initializePluginDirectory;
    loadPlugin(pluginPath: string): Promise<Plugin>;
    loadAllPlugins(): Promise<Plugin[]>;
    installPlugin(packageName: string, version?: string): Promise<Plugin>;
    uninstallPlugin(pluginId: string): Promise<void>;
    enablePlugin(pluginId: string): Promise<void>;
    disablePlugin(pluginId: string): Promise<void>;
    activatePlugin(pluginId: string): Promise<void>;
    deactivatePlugin(pluginId: string): Promise<void>;
    executeCommand(command: string, context: PluginContext): Promise<any>;
    getPlugins(): Plugin[];
    getPlugin(pluginId: string): Plugin | undefined;
    getCommands(): PluginCommand[];
    getKeybindings(): PluginKeybinding[];
    getViews(): PluginView[];
    getLanguages(): PluginLanguage[];
}
export declare const pluginManager: PluginManager;
export {};
//# sourceMappingURL=pluginService.d.ts.map