import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

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

class VoiceService {
  private sessions: Map<string, VoiceSession> = new Map();
  private config: VoiceConfig;
  private isListening: boolean = false;
  private currentSession: string | null = null;

  constructor() {
    this.config = {
      wakeWord: 'hey tantra',
      language: 'en-US',
      sensitivity: 0.7,
      timeout: 5000,
      enabled: true,
      commands: this.getDefaultCommands(),
    };
  }

  private getDefaultCommands(): VoiceCommand[] {
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

  async startListening(): Promise<VoiceSession> {
    if (this.isListening) {
      throw new Error('Voice service is already listening');
    }

    const sessionId = `session-${Date.now()}`;
    const session: VoiceSession = {
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

  async stopListening(sessionId?: string): Promise<void> {
    const targetSession = sessionId || this.currentSession;
    if (!targetSession) return;

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

  private async startVoiceRecognition(sessionId: string): Promise<void> {
    try {
      console.log(`[Voice] Starting recognition for session ${sessionId}`);
      
      // Real voice recognition implementation
      // This will be handled by the frontend Web Speech API
      // The backend will receive voice commands via WebSocket
      
      // For now, we'll simulate voice recognition for demo
      this.simulateVoiceRecognition(sessionId);
    } catch (error) {
      console.error('[Voice] Recognition error:', error);
    }
  }

  private async simulateVoiceRecognition(sessionId: string): Promise<void> {
    // This is a simulation - in real implementation, this would be actual voice recognition
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    // Simulate detecting wake word after 2 seconds
    setTimeout(() => {
      if (session.isActive) {
        console.log(`[Voice] Wake word "${session.wakeWord}" detected`);
        this.processVoiceCommand(sessionId, 'open file');
      }
    }, 2000);
  }

  async processVoiceCommand(sessionId: string, transcript: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    console.log(`[Voice] Processing command: "${transcript}"`);

    // Find matching command
    const command = this.findMatchingCommand(transcript, session.commands);
    if (command) {
      await this.executeVoiceCommand(sessionId, command, transcript);
    } else {
      console.log(`[Voice] No matching command found for: "${transcript}"`);
    }

    session.lastActivity = new Date();
  }

  private findMatchingCommand(transcript: string, commands: VoiceCommand[]): VoiceCommand | null {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    for (const command of commands) {
      if (!command.enabled) continue;
      
      const normalizedPhrase = command.phrase.toLowerCase();
      
      // Simple string matching - in real implementation, use fuzzy matching or NLP
      if (normalizedTranscript.includes(normalizedPhrase)) {
        return command;
      }
    }
    
    return null;
  }

  private async executeVoiceCommand(sessionId: string, command: VoiceCommand, transcript: string): Promise<void> {
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
    } catch (error) {
      console.error(`[Voice] Error executing command ${command.action}:`, error);
    }
  }

  private async handleFileOpen(transcript: string): Promise<void> {
    // Extract filename from transcript
    const filename = this.extractFilename(transcript);
    console.log(`[Voice] Opening file: ${filename}`);
    // This would trigger the file open action in the frontend
  }

  private async handleFileSave(): Promise<void> {
    console.log('[Voice] Saving current file');
    // This would trigger the file save action in the frontend
  }

  private async handleFileNew(transcript: string): Promise<void> {
    const filename = this.extractFilename(transcript);
    console.log(`[Voice] Creating new file: ${filename}`);
    // This would trigger the file creation action in the frontend
  }

  private async handleCodeRun(): Promise<void> {
    console.log('[Voice] Running current code');
    // This would trigger the code execution in the terminal
  }

  private async handleCodeDebug(): Promise<void> {
    console.log('[Voice] Starting debug session');
    // This would trigger the debugger
  }

  private async handleGitCommit(transcript: string): Promise<void> {
    const message = this.extractCommitMessage(transcript);
    console.log(`[Voice] Committing with message: ${message}`);
    // This would trigger git commit
  }

  private async handleGitPush(): Promise<void> {
    console.log('[Voice] Pushing to remote');
    // This would trigger git push
  }

  private async handleSearchCode(transcript: string): Promise<void> {
    const query = this.extractSearchQuery(transcript);
    console.log(`[Voice] Searching for: ${query}`);
    // This would trigger code search
  }

  private async handleAiChat(transcript: string): Promise<void> {
    const question = this.extractQuestion(transcript);
    console.log(`[Voice] AI question: ${question}`);
    // This would trigger AI chat
  }

  private async handleDeployStart(): Promise<void> {
    console.log('[Voice] Starting deployment');
    // This would trigger deployment
  }

  private extractFilename(transcript: string): string {
    // Simple extraction - in real implementation, use NLP
    const words = transcript.split(' ');
    const fileIndex = words.findIndex(word => word === 'file');
    if (fileIndex !== -1 && words[fileIndex + 1]) {
      return words[fileIndex + 1];
    }
    return 'untitled.txt';
  }

  private extractCommitMessage(transcript: string): string {
    // Extract commit message from transcript
    const messageIndex = transcript.indexOf('message');
    if (messageIndex !== -1) {
      return transcript.substring(messageIndex + 8).trim();
    }
    return 'Voice commit';
  }

  private extractSearchQuery(transcript: string): string {
    // Extract search query from transcript
    const forIndex = transcript.indexOf('for');
    if (forIndex !== -1) {
      return transcript.substring(forIndex + 4).trim();
    }
    return transcript;
  }

  private extractQuestion(transcript: string): string {
    // Extract question from transcript
    const helpIndex = transcript.indexOf('help');
    if (helpIndex !== -1) {
      return transcript.substring(helpIndex + 5).trim();
    }
    return transcript;
  }

  async addCommand(command: VoiceCommand): Promise<void> {
    this.config.commands.push(command);
  }

  async removeCommand(commandId: string): Promise<void> {
    this.config.commands = this.config.commands.filter(cmd => cmd.id !== commandId);
  }

  async updateConfig(config: Partial<VoiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  getSessions(): VoiceSession[] {
    return Array.from(this.sessions.values());
  }

  getCurrentSession(): VoiceSession | null {
    return this.currentSession ? this.sessions.get(this.currentSession) || null : null;
  }

  isVoiceActive(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();