export interface VoiceCommand {
    id: string;
    phrase: string;
    action: string;
    parameters?: Record<string, any>;
    enabled: boolean;
    confidence: number;
}
export interface VoiceSession {
    id: string;
    isActive: boolean;
    wakeWord: string;
    language: string;
    commands: VoiceCommand[];
    startTime: Date;
    lastActivity: Date;
}
export interface VoiceConfig {
    wakeWord: string;
    language: string;
    sensitivity: number;
    timeout: number;
    enabled: boolean;
    commands: VoiceCommand[];
}
declare class VoiceService {
    private sessions;
    private config;
    private isListening;
    private currentSession;
    constructor();
    private getDefaultCommands;
    startListening(): Promise<VoiceSession>;
    stopListening(sessionId?: string): Promise<void>;
    private startVoiceRecognition;
    private simulateVoiceRecognition;
    processVoiceCommand(sessionId: string, transcript: string): Promise<void>;
    private findMatchingCommand;
    private executeVoiceCommand;
    private handleFileOpen;
    private handleFileSave;
    private handleFileNew;
    private handleCodeRun;
    private handleCodeDebug;
    private handleGitCommit;
    private handleGitPush;
    private handleSearchCode;
    private handleAiChat;
    private handleDeployStart;
    private extractFilename;
    private extractCommitMessage;
    private extractSearchQuery;
    private extractQuestion;
    addCommand(command: VoiceCommand): Promise<void>;
    removeCommand(commandId: string): Promise<void>;
    updateConfig(config: Partial<VoiceConfig>): Promise<void>;
    getConfig(): VoiceConfig;
    getSessions(): VoiceSession[];
    getCurrentSession(): VoiceSession | null;
    isVoiceActive(): boolean;
}
export declare const voiceService: VoiceService;
export {};
//# sourceMappingURL=voiceService.d.ts.map