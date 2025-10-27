import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

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

class DebugService extends EventEmitter {
  private sessions: Map<string, DebugSession> = new Map();
  private nextSessionId: number = 1;

  constructor() {
    super();
  }

  async createSession(name: string, type: string, config: DebugConfig): Promise<DebugSession> {
    const sessionId = `debug-${this.nextSessionId++}`;
    
    const session: DebugSession = {
      id: sessionId,
      name,
      type: type as any,
      config,
      status: 'stopped',
      breakpoints: new Map(),
      variables: new Map(),
      callStack: [],
      startTime: new Date(),
    };

    this.sessions.set(sessionId, session);
    
    this.emit('sessionCreated', { sessionId, session });
    
    return session;
  }

  async startSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    if (session.status !== 'stopped') {
      throw new Error(`Debug session ${sessionId} is not stopped`);
    }

    try {
      session.status = 'running';
      
      // Start the debug process based on type
      const process = await this.startDebugProcess(session);
      session.process = process;
      
      // Set up process event handlers
      this.setupProcessHandlers(session, process);
      
      this.emit('sessionStarted', { sessionId, session });
      
    } catch (error) {
      session.status = 'stopped';
      throw error;
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    if (session.process) {
      session.process.kill();
      session.process = undefined;
    }

    session.status = 'terminated';
    session.endTime = new Date();
    
    this.emit('sessionStopped', { sessionId, session });
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send SIGSTOP to pause the process
    session.process.kill('SIGSTOP');
    session.status = 'paused';
    
    this.emit('sessionPaused', { sessionId, session });
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send SIGCONT to resume the process
    session.process.kill('SIGCONT');
    session.status = 'running';
    
    this.emit('sessionResumed', { sessionId, session });
  }

  async addBreakpoint(sessionId: string, breakpoint: Omit<Breakpoint, 'id'>): Promise<Breakpoint> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const bp: Breakpoint = {
      ...breakpoint,
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    session.breakpoints.set(bp.id, bp);
    
    this.emit('breakpointAdded', { sessionId, breakpoint: bp });
    
    return bp;
  }

  async removeBreakpoint(sessionId: string, breakpointId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const removed = session.breakpoints.delete(breakpointId);
    if (removed) {
      this.emit('breakpointRemoved', { sessionId, breakpointId });
    }
  }

  async updateBreakpoint(sessionId: string, breakpointId: string, updates: Partial<Breakpoint>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const breakpoint = session.breakpoints.get(breakpointId);
    if (!breakpoint) {
      throw new Error(`Breakpoint ${breakpointId} not found`);
    }

    Object.assign(breakpoint, updates);
    
    this.emit('breakpointUpdated', { sessionId, breakpoint });
  }

  async stepOver(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send step over command to debugger
    this.sendDebugCommand(session, 'stepOver');
  }

  async stepInto(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send step into command to debugger
    this.sendDebugCommand(session, 'stepInto');
  }

  async stepOut(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send step out command to debugger
    this.sendDebugCommand(session, 'stepOut');
  }

  async continue(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send continue command to debugger
    this.sendDebugCommand(session, 'continue');
  }

  async evaluateExpression(sessionId: string, expression: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Debug session ${sessionId} not found or not running`);
    }

    // Send evaluate command to debugger
    return this.sendDebugCommand(session, 'evaluate', { expression });
  }

  async getVariables(sessionId: string, frameId?: number): Promise<Map<string, any>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    // Return variables for the specified frame or current frame
    const frame = frameId ? session.callStack.find(f => f.id === frameId) : session.currentFrame;
    return frame ? frame.variables : session.variables;
  }

  async getCallStack(sessionId: string): Promise<CallFrame[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    return session.callStack;
  }

  async setCurrentFrame(sessionId: string, frameId: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const frame = session.callStack.find(f => f.id === frameId);
    if (!frame) {
      throw new Error(`Frame ${frameId} not found`);
    }

    session.currentFrame = frame;
  }

  private async startDebugProcess(session: DebugSession): Promise<ChildProcess> {
    const { config } = session;
    
    switch (session.type) {
      case 'node':
        return this.startNodeDebugProcess(config);
      case 'python':
        return this.startPythonDebugProcess(config);
      case 'chrome':
        return this.startChromeDebugProcess(config);
      case 'firefox':
        return this.startFirefoxDebugProcess(config);
      default:
        return this.startCustomDebugProcess(config);
    }
  }

  private async startNodeDebugProcess(config: DebugConfig): Promise<ChildProcess> {
    const args = [
      '--inspect',
      ...config.runtimeArgs,
      config.program,
      ...config.args
    ];

    return spawn('node', args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  private async startPythonDebugProcess(config: DebugConfig): Promise<ChildProcess> {
    const args = [
      '-m', 'pdb',
      config.program,
      ...config.args
    ];

    return spawn('python', args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  private async startChromeDebugProcess(config: DebugConfig): Promise<ChildProcess> {
    const args = [
      '--remote-debugging-port=' + (config.port || 9222),
      '--user-data-dir=/tmp/chrome-debug',
      config.program
    ];

    return spawn('google-chrome', args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  private async startFirefoxDebugProcess(config: DebugConfig): Promise<ChildProcess> {
    const args = [
      '--start-debugger-server=' + (config.port || 9222),
      config.program
    ];

    return spawn('firefox', args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  private async startCustomDebugProcess(config: DebugConfig): Promise<ChildProcess> {
    return spawn(config.program, config.args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  private setupProcessHandlers(session: DebugSession, process: ChildProcess): void {
    process.stdout?.on('data', (data) => {
      this.emit('debugOutput', {
        sessionId: session.id,
        type: 'stdout',
        data: data.toString()
      });
    });

    process.stderr?.on('data', (data) => {
      this.emit('debugOutput', {
        sessionId: session.id,
        type: 'stderr',
        data: data.toString()
      });
    });

    process.on('exit', (code, signal) => {
      session.status = 'terminated';
      session.endTime = new Date();
      
      this.emit('sessionTerminated', {
        sessionId: session.id,
        code,
        signal
      });
    });

    process.on('error', (error) => {
      this.emit('debugError', {
        sessionId: session.id,
        error: error.message
      });
    });
  }

  private async sendDebugCommand(session: DebugSession, command: string, params?: any): Promise<any> {
    // This would send commands to the debugger process
    // Implementation depends on the specific debugger protocol
    console.log(`[Debug] Sending command ${command} to session ${session.id}`, params);
    
    // For now, just emit an event
    this.emit('debugCommand', {
      sessionId: session.id,
      command,
      params
    });
  }

  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  async cleanup(): Promise<void> {
    // Stop all active sessions
    for (const session of this.sessions.values()) {
      if (session.status === 'running' || session.status === 'paused') {
        await this.stopSession(session.id);
      }
    }
  }
}

export const debugService = new DebugService();