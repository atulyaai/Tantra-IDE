import { io, Socket } from 'socket.io-client';

export interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  preselect?: boolean;
  commitCharacters?: string[];
  additionalTextEdits?: any[];
  command?: any;
  insertTextRules?: number;
  range?: any;
}

export interface CompletionContext {
  triggerKind: number;
  triggerCharacter?: string;
}

export class CodeCompletionService {
  private socket: Socket | null = null;
  private isConnected = false;
  private completionCache = new Map<string, CompletionItem[]>();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('[CodeCompletion] Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('[CodeCompletion] Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('completionResponse', (data: any) => {
        console.log('[CodeCompletion] Received completion response:', data);
      });

      this.socket.on('error', (error: any) => {
        console.error('[CodeCompletion] Socket error:', error);
      });
    } catch (error) {
      console.error('[CodeCompletion] Failed to initialize socket:', error);
    }
  }

  async getCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: CompletionContext
  ): Promise<CompletionItem[]> {
    try {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const textAfterPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      });

      const cacheKey = this.generateCacheKey(textUntilPosition, position);
      
      // Check cache first
      if (this.completionCache.has(cacheKey)) {
        const cached = this.completionCache.get(cacheKey);
        if (cached) {
          console.log('[CodeCompletion] Using cached completions');
          return cached;
        }
      }

      // Get AI-powered completions
      const completions = await this.getAICompletions(
        textUntilPosition,
        textAfterPosition,
        position,
        context
      );

      // Cache the results
      this.completionCache.set(cacheKey, completions);
      
      // Clear cache after timeout
      setTimeout(() => {
        this.completionCache.delete(cacheKey);
      }, this.cacheTimeout);

      return completions;
    } catch (error) {
      console.error('[CodeCompletion] Error getting completions:', error);
      return this.getFallbackCompletions(model, position, context);
    }
  }

  private async getAICompletions(
    textBefore: string,
    textAfter: string,
    position: monaco.Position,
    context: CompletionContext
  ): Promise<CompletionItem[]> {
    if (!this.isConnected || !this.socket) {
      return this.getFallbackCompletions(null, position, context);
    }

    try {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[CodeCompletion] AI completion timeout, using fallback');
          resolve(this.getFallbackCompletions(null, position, context));
        }, 5000);

        this.socket!.emit('requestCompletion', {
          textBefore,
          textAfter,
          position: {
            lineNumber: position.lineNumber,
            column: position.column
          },
          context,
          timestamp: Date.now()
        });

        const handler = (data: any) => {
          clearTimeout(timeout);
          this.socket!.off('completionResponse', handler);
          
          if (data && data.completions) {
            resolve(data.completions);
          } else {
            resolve(this.getFallbackCompletions(null, position, context));
          }
        };

        this.socket!.on('completionResponse', handler);
      });
    } catch (error) {
      console.error('[CodeCompletion] Error requesting AI completions:', error);
      return this.getFallbackCompletions(null, position, context);
    }
  }

  private getFallbackCompletions(
    model: monaco.editor.ITextModel | null,
    position: monaco.Position,
    context: CompletionContext
  ): CompletionItem[] {
    // Basic fallback completions based on common patterns
    const completions: CompletionItem[] = [];

    if (context.triggerCharacter === '.') {
      // Object property completions
      completions.push(
        {
          label: 'length',
          kind: monaco.languages.CompletionItemKind.Property,
          detail: 'Property',
          insertText: 'length'
        },
        {
          label: 'toString',
          kind: monaco.languages.CompletionItemKind.Method,
          detail: 'Method',
          insertText: 'toString()'
        },
        {
          label: 'valueOf',
          kind: monaco.languages.CompletionItemKind.Method,
          detail: 'Method',
          insertText: 'valueOf()'
        }
      );
    } else if (context.triggerCharacter === '(') {
      // Function call completions
      completions.push(
        {
          label: 'console.log',
          kind: monaco.languages.CompletionItemKind.Function,
          detail: 'Function',
          insertText: 'console.log(${1:message})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'console.error',
          kind: monaco.languages.CompletionItemKind.Function,
          detail: 'Function',
          insertText: 'console.error(${1:message})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      );
    } else {
      // General completions
      completions.push(
        {
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'const',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'const ${1:name} = ${2:value};'
        },
        {
          label: 'let',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'let ${1:name} = ${2:value};'
        },
        {
          label: 'var',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'var ${1:name} = ${2:value};'
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:// code}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'while',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'while (${1:condition}) {\n\t${2:// code}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'try',
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'Keyword',
          insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:// handle error}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      );
    }

    return completions;
  }

  private generateCacheKey(textBefore: string, position: monaco.Position): string {
    // Create a simple hash of the text before cursor and position
    const textHash = textBefore.slice(-100); // Use last 100 characters
    return `${textHash}_${position.lineNumber}_${position.column}`;
  }

  // Method to clear the completion cache
  clearCache(): void {
    this.completionCache.clear();
  }

  // Method to disconnect the service
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const codeCompletionService = new CodeCompletionService();
