import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
export interface Breakpoint {
    id: string;
    file: string;
    line: number;
    column?: number;
    condition?: string;
    hitCount?: number;
    enabled: boolean;
}
export interface DebugSession {
    id: string;
    name: string;
    type: 'node' | 'python' | 'chrome' | 'firefox' | 'custom';
    config: DebugConfig;
    status: 'stopped' | 'running' | 'paused' | 'terminated';
    process?: ChildProcess;
    breakpoints: Map<string, Breakpoint>;
    variables: Map<string, any>;
    callStack: CallFrame[];
    currentFrame?: CallFrame;
    startTime: Date;
    endTime?: Date;
}
export interface DebugConfig {
    program: string;
    args: string[];
    cwd: string;
    env: Record<string, string>;
    runtimeArgs: string[];
    console: 'integratedTerminal' | 'internalConsole' | 'externalTerminal';
    stopOnEntry: boolean;
    autoAttach: boolean;
    port?: number;
    hostname?: string;
    timeout?: number;
}
export interface CallFrame {
    id: number;
    name: string;
    source: {
        name: string;
        path: string;
        line: number;
        column: number;
    };
    line: number;
    column: number;
    variables: Map<string, any>;
}
export interface DebugEvent {
    type: 'started' | 'stopped' | 'paused' | 'resumed' | 'breakpoint' | 'exception' | 'output' | 'terminated';
    sessionId: string;
    data?: any;
    timestamp: Date;
}
declare class DebugService extends EventEmitter {
    private sessions;
    private nextSessionId;
    constructor();
    createSession(name: string, type: string, config: DebugConfig): Promise<DebugSession>;
    startSession(sessionId: string): Promise<void>;
    stopSession(sessionId: string): Promise<void>;
    pauseSession(sessionId: string): Promise<void>;
    resumeSession(sessionId: string): Promise<void>;
    addBreakpoint(sessionId: string, breakpoint: Omit<Breakpoint, 'id'>): Promise<Breakpoint>;
    removeBreakpoint(sessionId: string, breakpointId: string): Promise<void>;
    updateBreakpoint(sessionId: string, breakpointId: string, updates: Partial<Breakpoint>): Promise<void>;
    stepOver(sessionId: string): Promise<void>;
    stepInto(sessionId: string): Promise<void>;
    stepOut(sessionId: string): Promise<void>;
    continue(sessionId: string): Promise<void>;
    evaluateExpression(sessionId: string, expression: string): Promise<any>;
    getVariables(sessionId: string, frameId?: number): Promise<Map<string, any>>;
    getCallStack(sessionId: string): Promise<CallFrame[]>;
    setCurrentFrame(sessionId: string, frameId: number): Promise<void>;
    private startDebugProcess;
    private startNodeDebugProcess;
    private startPythonDebugProcess;
    private startChromeDebugProcess;
    private startFirefoxDebugProcess;
    private startCustomDebugProcess;
    private setupProcessHandlers;
    private sendDebugCommand;
    getSession(sessionId: string): DebugSession | undefined;
    getAllSessions(): DebugSession[];
    cleanup(): Promise<void>;
}
export declare const debugService: DebugService;
export {};
//# sourceMappingURL=debugService.d.ts.map