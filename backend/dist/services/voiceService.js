import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
class VoiceService {
    constructor() {
        this.sessions = new Map();
        this.isListening = false;
        this.currentSession = null;
        this.config = {
            wakeWord: 'hey tantra',
            language: 'en-US',
            sensitivity: 0.7,
            timeout: 5000,
            enabled: true,
            commands: this.getDefaultCommands(),
        };
    }
    getDefaultCommands() {
        return [
            {
                id: 'open-file',
                phrase: 'open file',
                action: 'file.open',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'save-file',
                phrase: 'save file',
                action: 'file.save',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'new-file',
                phrase: 'new file',
                action: 'file.new',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'run-code',
                phrase: 'run code',
                action: 'code.run',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'debug-code',
                phrase: 'debug code',
                action: 'code.debug',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'git-commit',
                phrase: 'commit changes',
                action: 'git.commit',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'git-push',
                phrase: 'push changes',
                action: 'git.push',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'search-code',
                phrase: 'search for',
                action: 'search.code',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'ai-help',
                phrase: 'ai help',
                action: 'ai.chat',
                enabled: true,
                confidence: 0.8,
            },
            {
                id: 'deploy-app',
                phrase: 'deploy app',
                action: 'deploy.start',
                enabled: true,
                confidence: 0.8,
            },
        ];
    }
    async startListening() {
        if (this.isListening) {
            throw new Error('Voice service is already listening');
        }
        const sessionId = `session-${Date.now()}`;
        const session = {
            id: sessionId,
            isActive: true,
            wakeWord: this.config.wakeWord,
            language: this.config.language,
            commands: this.config.commands,
            startTime: new Date(),
            lastActivity: new Date(),
        };
        this.sessions.set(sessionId, session);
        this.currentSession = sessionId;
        this.isListening = true;
        // Start voice recognition in the background
        this.startVoiceRecognition(sessionId);
        return session;
    }
    async stopListening(sessionId) {
        const targetSession = sessionId || this.currentSession;
        if (!targetSession)
            return;
        const session = this.sessions.get(targetSession);
        if (session) {
            session.isActive = false;
            this.sessions.delete(targetSession);
        }
        if (targetSession === this.currentSession) {
            this.currentSession = null;
            this.isListening = false;
        }
    }
    async startVoiceRecognition(sessionId) {
        try {
            // This would integrate with a speech recognition service
            // For now, we'll simulate voice recognition
            console.log(`[Voice] Starting recognition for session ${sessionId}`);
            // In a real implementation, this would:
            // 1. Connect to a speech recognition service (Web Speech API, Azure, Google, etc.)
            // 2. Listen for the wake word
            // 3. Process commands when detected
            // 4. Execute the corresponding actions
            // Simulate voice recognition for demo
            this.simulateVoiceRecognition(sessionId);
        }
        catch (error) {
            console.error('[Voice] Recognition error:', error);
        }
    }
    async simulateVoiceRecognition(sessionId) {
        // This is a simulation - in real implementation, this would be actual voice recognition
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive)
            return;
        // Simulate detecting wake word after 2 seconds
        setTimeout(() => {
            if (session.isActive) {
                console.log(`[Voice] Wake word "${session.wakeWord}" detected`);
                this.processVoiceCommand(sessionId, 'open file');
            }
        }, 2000);
    }
    async processVoiceCommand(sessionId, transcript) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive)
            return;
        console.log(`[Voice] Processing command: "${transcript}"`);
        // Find matching command
        const command = this.findMatchingCommand(transcript, session.commands);
        if (command) {
            await this.executeVoiceCommand(sessionId, command, transcript);
        }
        else {
            console.log(`[Voice] No matching command found for: "${transcript}"`);
        }
        session.lastActivity = new Date();
    }
    findMatchingCommand(transcript, commands) {
        const normalizedTranscript = transcript.toLowerCase().trim();
        for (const command of commands) {
            if (!command.enabled)
                continue;
            const normalizedPhrase = command.phrase.toLowerCase();
            // Simple string matching - in real implementation, use fuzzy matching or NLP
            if (normalizedTranscript.includes(normalizedPhrase)) {
                return command;
            }
        }
        return null;
    }
    async executeVoiceCommand(sessionId, command, transcript) {
        console.log(`[Voice] Executing command: ${command.action}`);
        try {
            switch (command.action) {
                case 'file.open':
                    await this.handleFileOpen(transcript);
                    break;
                case 'file.save':
                    await this.handleFileSave();
                    break;
                case 'file.new':
                    await this.handleFileNew(transcript);
                    break;
                case 'code.run':
                    await this.handleCodeRun();
                    break;
                case 'code.debug':
                    await this.handleCodeDebug();
                    break;
                case 'git.commit':
                    await this.handleGitCommit(transcript);
                    break;
                case 'git.push':
                    await this.handleGitPush();
                    break;
                case 'search.code':
                    await this.handleSearchCode(transcript);
                    break;
                case 'ai.chat':
                    await this.handleAiChat(transcript);
                    break;
                case 'deploy.start':
                    await this.handleDeployStart();
                    break;
                default:
                    console.log(`[Voice] Unknown command: ${command.action}`);
            }
        }
        catch (error) {
            console.error(`[Voice] Error executing command ${command.action}:`, error);
        }
    }
    async handleFileOpen(transcript) {
        // Extract filename from transcript
        const filename = this.extractFilename(transcript);
        console.log(`[Voice] Opening file: ${filename}`);
        // This would trigger the file open action in the frontend
    }
    async handleFileSave() {
        console.log('[Voice] Saving current file');
        // This would trigger the file save action in the frontend
    }
    async handleFileNew(transcript) {
        const filename = this.extractFilename(transcript);
        console.log(`[Voice] Creating new file: ${filename}`);
        // This would trigger the file creation action in the frontend
    }
    async handleCodeRun() {
        console.log('[Voice] Running current code');
        // This would trigger the code execution in the terminal
    }
    async handleCodeDebug() {
        console.log('[Voice] Starting debug session');
        // This would trigger the debugger
    }
    async handleGitCommit(transcript) {
        const message = this.extractCommitMessage(transcript);
        console.log(`[Voice] Committing with message: ${message}`);
        // This would trigger git commit
    }
    async handleGitPush() {
        console.log('[Voice] Pushing to remote');
        // This would trigger git push
    }
    async handleSearchCode(transcript) {
        const query = this.extractSearchQuery(transcript);
        console.log(`[Voice] Searching for: ${query}`);
        // This would trigger code search
    }
    async handleAiChat(transcript) {
        const question = this.extractQuestion(transcript);
        console.log(`[Voice] AI question: ${question}`);
        // This would trigger AI chat
    }
    async handleDeployStart() {
        console.log('[Voice] Starting deployment');
        // This would trigger deployment
    }
    extractFilename(transcript) {
        // Simple extraction - in real implementation, use NLP
        const words = transcript.split(' ');
        const fileIndex = words.findIndex(word => word === 'file');
        if (fileIndex !== -1 && words[fileIndex + 1]) {
            return words[fileIndex + 1];
        }
        return 'untitled.txt';
    }
    extractCommitMessage(transcript) {
        // Extract commit message from transcript
        const messageIndex = transcript.indexOf('message');
        if (messageIndex !== -1) {
            return transcript.substring(messageIndex + 8).trim();
        }
        return 'Voice commit';
    }
    extractSearchQuery(transcript) {
        // Extract search query from transcript
        const forIndex = transcript.indexOf('for');
        if (forIndex !== -1) {
            return transcript.substring(forIndex + 4).trim();
        }
        return transcript;
    }
    extractQuestion(transcript) {
        // Extract question from transcript
        const helpIndex = transcript.indexOf('help');
        if (helpIndex !== -1) {
            return transcript.substring(helpIndex + 5).trim();
        }
        return transcript;
    }
    async addCommand(command) {
        this.config.commands.push(command);
    }
    async removeCommand(commandId) {
        this.config.commands = this.config.commands.filter(cmd => cmd.id !== commandId);
    }
    async updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getConfig() {
        return { ...this.config };
    }
    getSessions() {
        return Array.from(this.sessions.values());
    }
    getCurrentSession() {
        return this.currentSession ? this.sessions.get(this.currentSession) || null : null;
    }
    isVoiceActive() {
        return this.isListening;
    }
}
export const voiceService = new VoiceService();
//# sourceMappingURL=voiceService.js.map