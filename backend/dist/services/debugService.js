import { spawn } from 'child_process';
import { EventEmitter } from 'events';
class DebugService extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map();
        this.nextSessionId = 1;
    }
    async createSession(name, type, config) {
        const sessionId = `debug-${this.nextSessionId++}`;
        const session = {
            id: sessionId,
            name,
            type: type,
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
    async startSession(sessionId) {
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
        }
        catch (error) {
            session.status = 'stopped';
            throw error;
        }
    }
    async stopSession(sessionId) {
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
    async pauseSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send SIGSTOP to pause the process
        session.process.kill('SIGSTOP');
        session.status = 'paused';
        this.emit('sessionPaused', { sessionId, session });
    }
    async resumeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send SIGCONT to resume the process
        session.process.kill('SIGCONT');
        session.status = 'running';
        this.emit('sessionResumed', { sessionId, session });
    }
    async addBreakpoint(sessionId, breakpoint) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }
        const bp = {
            ...breakpoint,
            id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        session.breakpoints.set(bp.id, bp);
        this.emit('breakpointAdded', { sessionId, breakpoint: bp });
        return bp;
    }
    async removeBreakpoint(sessionId, breakpointId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }
        const removed = session.breakpoints.delete(breakpointId);
        if (removed) {
            this.emit('breakpointRemoved', { sessionId, breakpointId });
        }
    }
    async updateBreakpoint(sessionId, breakpointId, updates) {
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
    async stepOver(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send step over command to debugger
        this.sendDebugCommand(session, 'stepOver');
    }
    async stepInto(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send step into command to debugger
        this.sendDebugCommand(session, 'stepInto');
    }
    async stepOut(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send step out command to debugger
        this.sendDebugCommand(session, 'stepOut');
    }
    async continue(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send continue command to debugger
        this.sendDebugCommand(session, 'continue');
    }
    async evaluateExpression(sessionId, expression) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.process) {
            throw new Error(`Debug session ${sessionId} not found or not running`);
        }
        // Send evaluate command to debugger
        return this.sendDebugCommand(session, 'evaluate', { expression });
    }
    async getVariables(sessionId, frameId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }
        // Return variables for the specified frame or current frame
        const frame = frameId ? session.callStack.find(f => f.id === frameId) : session.currentFrame;
        return frame ? frame.variables : session.variables;
    }
    async getCallStack(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Debug session ${sessionId} not found`);
        }
        return session.callStack;
    }
    async setCurrentFrame(sessionId, frameId) {
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
    async startDebugProcess(session) {
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
    async startNodeDebugProcess(config) {
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
    async startPythonDebugProcess(config) {
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
    async startChromeDebugProcess(config) {
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
    async startFirefoxDebugProcess(config) {
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
    async startCustomDebugProcess(config) {
        return spawn(config.program, config.args, {
            cwd: config.cwd,
            env: { ...process.env, ...config.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });
    }
    setupProcessHandlers(session, process) {
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
    async sendDebugCommand(session, command, params) {
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
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    async cleanup() {
        // Stop all active sessions
        for (const session of this.sessions.values()) {
            if (session.status === 'running' || session.status === 'paused') {
                await this.stopSession(session.id);
            }
        }
    }
}
export const debugService = new DebugService();
//# sourceMappingURL=debugService.js.map