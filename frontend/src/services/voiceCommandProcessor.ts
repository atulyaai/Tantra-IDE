import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';

export interface VoiceCommand {
  action: string;
  parameters: string[];
  confidence: number;
}

export class VoiceCommandProcessor {
  private editorStore = useEditorStore.getState();
  private settingsStore = useSettingsStore.getState();

  // Command patterns for voice recognition
  private commandPatterns = {
    // File operations
    'open file': { action: 'file.open', pattern: /open file (.+)/i },
    'save file': { action: 'file.save', pattern: /save file/i },
    'new file': { action: 'file.new', pattern: /new file (.+)/i },
    'close file': { action: 'file.close', pattern: /close file/i },
    'delete file': { action: 'file.delete', pattern: /delete file (.+)/i },
    
    // Editor operations
    'run code': { action: 'editor.run', pattern: /run code/i },
    'debug code': { action: 'editor.debug', pattern: /debug code/i },
    'format code': { action: 'editor.format', pattern: /format code/i },
    'find text': { action: 'editor.find', pattern: /find (.+)/i },
    'replace text': { action: 'editor.replace', pattern: /replace (.+) with (.+)/i },
    
    // Git operations
    'commit changes': { action: 'git.commit', pattern: /commit changes/i },
    'push changes': { action: 'git.push', pattern: /push changes/i },
    'pull changes': { action: 'git.pull', pattern: /pull changes/i },
    'create branch': { action: 'git.branch', pattern: /create branch (.+)/i },
    'switch branch': { action: 'git.switch', pattern: /switch to branch (.+)/i },
    
    // AI operations
    'ai help': { action: 'ai.help', pattern: /ai help (.+)/i },
    'ai explain': { action: 'ai.explain', pattern: /ai explain (.+)/i },
    'ai generate': { action: 'ai.generate', pattern: /ai generate (.+)/i },
    'ai fix': { action: 'ai.fix', pattern: /ai fix (.+)/i },
    
    // Search operations
    'search for': { action: 'search.text', pattern: /search for (.+)/i },
    'search files': { action: 'search.files', pattern: /search files (.+)/i },
    
    // Deployment
    'deploy app': { action: 'deploy.start', pattern: /deploy app/i },
    'build app': { action: 'deploy.build', pattern: /build app/i },
    
    // Terminal
    'open terminal': { action: 'terminal.open', pattern: /open terminal/i },
    'run command': { action: 'terminal.run', pattern: /run command (.+)/i },
    
    // Navigation
    'go to line': { action: 'editor.goto', pattern: /go to line (\d+)/i },
    'next tab': { action: 'editor.nextTab', pattern: /next tab/i },
    'previous tab': { action: 'editor.prevTab', pattern: /previous tab/i },
    'close tab': { action: 'editor.closeTab', pattern: /close tab/i },
  };

  processCommand(transcript: string): VoiceCommand | null {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Find matching command pattern
    for (const [key, command] of Object.entries(this.commandPatterns)) {
      const match = normalizedTranscript.match(command.pattern);
      if (match) {
        const parameters = match.slice(1); // Extract captured groups
        return {
          action: command.action,
          parameters,
          confidence: this.calculateConfidence(normalizedTranscript, key)
        };
      }
    }
    
    return null;
  }

  private calculateConfidence(transcript: string, commandKey: string): number {
    // Simple confidence calculation based on word overlap
    const transcriptWords = transcript.split(' ');
    const commandWords = commandKey.split(' ');
    
    let matches = 0;
    for (const word of commandWords) {
      if (transcriptWords.some(tw => tw.includes(word) || word.includes(tw))) {
        matches++;
      }
    }
    
    return matches / commandWords.length;
  }

  async executeCommand(command: VoiceCommand): Promise<boolean> {
    try {
      console.log('[Voice] Executing command:', command);
      
      switch (command.action) {
        case 'file.open':
          return await this.handleFileOpen(command.parameters[0]);
        
        case 'file.save':
          return await this.handleFileSave();
        
        case 'file.new':
          return await this.handleFileNew(command.parameters[0]);
        
        case 'file.close':
          return await this.handleFileClose();
        
        case 'editor.run':
          return await this.handleEditorRun();
        
        case 'editor.debug':
          return await this.handleEditorDebug();
        
        case 'editor.format':
          return await this.handleEditorFormat();
        
        case 'editor.find':
          return await this.handleEditorFind(command.parameters[0]);
        
        case 'editor.replace':
          return await this.handleEditorReplace(command.parameters[0], command.parameters[1]);
        
        case 'git.commit':
          return await this.handleGitCommit();
        
        case 'git.push':
          return await this.handleGitPush();
        
        case 'git.pull':
          return await this.handleGitPull();
        
        case 'git.branch':
          return await this.handleGitBranch(command.parameters[0]);
        
        case 'git.switch':
          return await this.handleGitSwitch(command.parameters[0]);
        
        case 'ai.help':
          return await this.handleAIHelp(command.parameters[0]);
        
        case 'ai.explain':
          return await this.handleAIExplain(command.parameters[0]);
        
        case 'ai.generate':
          return await this.handleAIGenerate(command.parameters[0]);
        
        case 'ai.fix':
          return await this.handleAIFix(command.parameters[0]);
        
        case 'search.text':
          return await this.handleSearchText(command.parameters[0]);
        
        case 'search.files':
          return await this.handleSearchFiles(command.parameters[0]);
        
        case 'deploy.start':
          return await this.handleDeployStart();
        
        case 'deploy.build':
          return await this.handleDeployBuild();
        
        case 'terminal.open':
          return await this.handleTerminalOpen();
        
        case 'terminal.run':
          return await this.handleTerminalRun(command.parameters[0]);
        
        case 'editor.goto':
          return await this.handleEditorGoto(parseInt(command.parameters[0]));
        
        case 'editor.nextTab':
          return await this.handleEditorNextTab();
        
        case 'editor.prevTab':
          return await this.handleEditorPrevTab();
        
        case 'editor.closeTab':
          return await this.handleEditorCloseTab();
        
        default:
          console.warn('[Voice] Unknown command:', command.action);
          return false;
      }
    } catch (error) {
      console.error('[Voice] Error executing command:', error);
      return false;
    }
  }

  // File operations
  private async handleFileOpen(filename: string): Promise<boolean> {
    try {
      console.log('[Voice] Opening file:', filename);
      return true;
    } catch (error) {
      console.error('[Voice] Error opening file:', error);
      return false;
    }
  }

  private async handleFileSave(): Promise<boolean> {
    try {
      console.log('[Voice] Saving file');
      return true;
    } catch (error) {
      console.error('[Voice] Error saving file:', error);
      return false;
    }
  }

  private async handleFileNew(filename: string): Promise<boolean> {
    try {
      console.log('[Voice] Creating new file:', filename);
      return true;
    } catch (error) {
      console.error('[Voice] Error creating file:', error);
      return false;
    }
  }

  private async handleFileClose(): Promise<boolean> {
    try {
      console.log('[Voice] Closing file');
      return true;
    } catch (error) {
      console.error('[Voice] Error closing file:', error);
      return false;
    }
  }

  // Editor operations
  private async handleEditorRun(): Promise<boolean> {
    try {
      console.log('[Voice] Running code');
      return true;
    } catch (error) {
      console.error('[Voice] Error running code:', error);
      return false;
    }
  }

  private async handleEditorDebug(): Promise<boolean> {
    try {
      console.log('[Voice] Debugging code');
      return true;
    } catch (error) {
      console.error('[Voice] Error debugging code:', error);
      return false;
    }
  }

  private async handleEditorFormat(): Promise<boolean> {
    try {
      console.log('[Voice] Formatting code');
      return true;
    } catch (error) {
      console.error('[Voice] Error formatting code:', error);
      return false;
    }
  }

  private async handleEditorFind(text: string): Promise<boolean> {
    try {
      console.log('[Voice] Finding text:', text);
      return true;
    } catch (error) {
      console.error('[Voice] Error finding text:', error);
      return false;
    }
  }

  private async handleEditorReplace(searchText: string, replaceText: string): Promise<boolean> {
    try {
      console.log('[Voice] Replacing text:', searchText, 'with', replaceText);
      return true;
    } catch (error) {
      console.error('[Voice] Error replacing text:', error);
      return false;
    }
  }

  // Git operations
  private async handleGitCommit(): Promise<boolean> {
    try {
      console.log('[Voice] Committing changes');
      return true;
    } catch (error) {
      console.error('[Voice] Error committing changes:', error);
      return false;
    }
  }

  private async handleGitPush(): Promise<boolean> {
    try {
      console.log('[Voice] Pushing changes');
      return true;
    } catch (error) {
      console.error('[Voice] Error pushing changes:', error);
      return false;
    }
  }

  private async handleGitPull(): Promise<boolean> {
    try {
      console.log('[Voice] Pulling changes');
      return true;
    } catch (error) {
      console.error('[Voice] Error pulling changes:', error);
      return false;
    }
  }

  private async handleGitBranch(branchName: string): Promise<boolean> {
    try {
      console.log('[Voice] Creating branch:', branchName);
      return true;
    } catch (error) {
      console.error('[Voice] Error creating branch:', error);
      return false;
    }
  }

  private async handleGitSwitch(branchName: string): Promise<boolean> {
    try {
      console.log('[Voice] Switching to branch:', branchName);
      return true;
    } catch (error) {
      console.error('[Voice] Error switching branch:', error);
      return false;
    }
  }

  // AI operations
  private async handleAIHelp(question: string): Promise<boolean> {
    try {
      console.log('[Voice] AI help for:', question);
      return true;
    } catch (error) {
      console.error('[Voice] Error getting AI help:', error);
      return false;
    }
  }

  private async handleAIExplain(code: string): Promise<boolean> {
    try {
      console.log('[Voice] AI explaining:', code);
      return true;
    } catch (error) {
      console.error('[Voice] Error getting AI explanation:', error);
      return false;
    }
  }

  private async handleAIGenerate(prompt: string): Promise<boolean> {
    try {
      console.log('[Voice] AI generating:', prompt);
      return true;
    } catch (error) {
      console.error('[Voice] Error generating with AI:', error);
      return false;
    }
  }

  private async handleAIFix(issue: string): Promise<boolean> {
    try {
      console.log('[Voice] AI fixing:', issue);
      return true;
    } catch (error) {
      console.error('[Voice] Error fixing with AI:', error);
      return false;
    }
  }

  // Search operations
  private async handleSearchText(query: string): Promise<boolean> {
    try {
      console.log('[Voice] Searching for text:', query);
      return true;
    } catch (error) {
      console.error('[Voice] Error searching text:', error);
      return false;
    }
  }

  private async handleSearchFiles(query: string): Promise<boolean> {
    try {
      console.log('[Voice] Searching files:', query);
      return true;
    } catch (error) {
      console.error('[Voice] Error searching files:', error);
      return false;
    }
  }

  // Deployment operations
  private async handleDeployStart(): Promise<boolean> {
    try {
      console.log('[Voice] Starting deployment');
      return true;
    } catch (error) {
      console.error('[Voice] Error starting deployment:', error);
      return false;
    }
  }

  private async handleDeployBuild(): Promise<boolean> {
    try {
      console.log('[Voice] Building app');
      return true;
    } catch (error) {
      console.error('[Voice] Error building app:', error);
      return false;
    }
  }

  // Terminal operations
  private async handleTerminalOpen(): Promise<boolean> {
    try {
      console.log('[Voice] Opening terminal');
      return true;
    } catch (error) {
      console.error('[Voice] Error opening terminal:', error);
      return false;
    }
  }

  private async handleTerminalRun(command: string): Promise<boolean> {
    try {
      console.log('[Voice] Running terminal command:', command);
      return true;
    } catch (error) {
      console.error('[Voice] Error running terminal command:', error);
      return false;
    }
  }

  // Editor navigation
  private async handleEditorGoto(lineNumber: number): Promise<boolean> {
    try {
      console.log('[Voice] Going to line:', lineNumber);
      return true;
    } catch (error) {
      console.error('[Voice] Error going to line:', error);
      return false;
    }
  }

  private async handleEditorNextTab(): Promise<boolean> {
    try {
      console.log('[Voice] Next tab');
      return true;
    } catch (error) {
      console.error('[Voice] Error switching to next tab:', error);
      return false;
    }
  }

  private async handleEditorPrevTab(): Promise<boolean> {
    try {
      console.log('[Voice] Previous tab');
      return true;
    } catch (error) {
      console.error('[Voice] Error switching to previous tab:', error);
      return false;
    }
  }

  private async handleEditorCloseTab(): Promise<boolean> {
    try {
      console.log('[Voice] Closing tab');
      return true;
    } catch (error) {
      console.error('[Voice] Error closing tab:', error);
      return false;
    }
  }
}
