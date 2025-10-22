import { io, Socket } from 'socket.io-client';
import type { Message, ToolCall, WSEvent } from '../types/index.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class OllamaService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (chunk: string) => void> = new Map();
  private toolCallbacks: Map<string, (tool: ToolCall) => void> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[Ollama] Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('[Ollama] Disconnected from WebSocket');
    });

    this.socket.on('chat:stream', (data: { id: string; chunk: string }) => {
      const callback = this.messageCallbacks.get(data.id);
      if (callback) {
        callback(data.chunk);
      }
    });

    this.socket.on('tool:start', (tool: ToolCall) => {
      const callback = this.toolCallbacks.get(tool.id);
      if (callback) {
        callback({ ...tool, status: 'running' });
      }
    });

    this.socket.on('tool:complete', (tool: ToolCall) => {
      const callback = this.toolCallbacks.get(tool.id);
      if (callback) {
        callback({ ...tool, status: 'completed' });
      }
    });

    this.socket.on('error', (error) => {
      console.error('[Ollama] Error:', error);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  async sendMessage(
    message: string,
    context?: any,
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: ToolCall) => void
  ): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const messageId = `msg-${Date.now()}`;

    if (onChunk) {
      this.messageCallbacks.set(messageId, onChunk);
    }

    if (onToolCall) {
      this.toolCallbacks.set(messageId, onToolCall);
    }

    this.socket.emit('chat:message', {
      id: messageId,
      content: message,
      context,
    });
  }

  async generateCode(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `gen-${Date.now()}`;
      let code = '';

      this.messageCallbacks.set(id, (chunk) => {
        code += chunk;
      });

      this.socket.emit('generate:code', { id, prompt });

      this.socket.once(`generate:complete:${id}`, () => {
        this.messageCallbacks.delete(id);
        resolve(code);
      });

      this.socket.once(`generate:error:${id}`, (error) => {
        this.messageCallbacks.delete(id);
        reject(new Error(error));
      });
    });
  }

  async explainError(error: string, code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `explain-${Date.now()}`;
      let explanation = '';

      this.messageCallbacks.set(id, (chunk) => {
        explanation += chunk;
      });

      this.socket.emit('explain:error', { id, error, code });

      this.socket.once(`explain:complete:${id}`, () => {
        this.messageCallbacks.delete(id);
        resolve(explanation);
      });

      this.socket.once(`explain:error:${id}`, (err) => {
        this.messageCallbacks.delete(id);
        reject(new Error(err));
      });
    });
  }

  cleanup(messageId: string): void {
    this.messageCallbacks.delete(messageId);
    this.toolCallbacks.delete(messageId);
  }
}

export const ollamaService = new OllamaService();
export default ollamaService;

