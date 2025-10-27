import { exec } from 'child_process';
import { promisify } from 'util';
import * as fileService from '../services/fileService.js';
import path from 'path';

const execAsync = promisify(exec);

// Command sanitization to prevent injection attacks
function sanitizeCommand(command: string): string | null {
  // Remove dangerous characters and patterns
  const dangerousPatterns = [
    /[;&|`$(){}[\]\\]/g,  // Shell metacharacters
    /rm\s+-rf/,           // Dangerous rm commands
    /sudo/,               // Privilege escalation
    /chmod\s+777/,        // Dangerous permissions
    /wget\s+http/,        // Downloading files
    /curl\s+http/,        // Downloading files
    /nc\s+/,              // Netcat
    /python\s+-c/,        // Python code execution
    /node\s+-e/,          // Node.js code execution
  ];
  
  // Check for dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return null;
    }
  }
  
  // Allow only safe commands
  const allowedCommands = [
    /^ls\s+/,             // List directory
    /^pwd$/,              // Print working directory
    /^cd\s+/,             // Change directory
    /^cat\s+/,            // Read file
    /^grep\s+/,           // Search text
    /^find\s+/,           // Find files
    /^git\s+/,            // Git commands
    /^npm\s+/,            // NPM commands
    /^yarn\s+/,           // Yarn commands
    /^mkdir\s+/,          // Create directory
    /^touch\s+/,          // Create file
    /^echo\s+/,           // Echo text
    /^which\s+/,          // Find executable
    /^type\s+/,           // Type command
  ];
  
  // Check if command matches allowed patterns
  for (const pattern of allowedCommands) {
    if (pattern.test(command.trim())) {
      return command.trim();
    }
  }
  
  return null;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates if doesn\'t exist)',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories in a directory',
    parameters: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'The directory path to list',
        },
      },
      required: ['directory'],
    },
  },
  {
    name: 'search_code',
    description: 'Search for code patterns in files',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The search pattern (regex or text)',
        },
        path: {
          type: 'string',
          description: 'The directory to search in',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'run_command',
    description: 'Execute a terminal command',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute',
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new file with content',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path for the new file',
        },
        content: {
          type: 'string',
          description: 'The initial content of the file',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to delete',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_directory',
    description: 'Create a new directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path for the new directory',
        },
      },
      required: ['path'],
    },
  },
];

export async function executeTool(toolCall: ToolCall): Promise<ToolCall> {
  const { name, parameters } = toolCall;
  
  try {
    toolCall.status = 'running';
    
    let result: any;
    
    switch (name) {
      case 'read_file':
        result = await fileService.readFile(parameters.path);
        break;
        
      case 'write_file':
        await fileService.writeFile(parameters.path, parameters.content);
        result = { success: true, message: 'File written successfully' };
        break;
        
      case 'create_file':
        await fileService.createFile(parameters.path, parameters.content || '');
        result = { success: true, message: 'File created successfully' };
        break;
        
      case 'delete_file':
        await fileService.deleteFile(parameters.path);
        result = { success: true, message: 'File deleted successfully' };
        break;
        
      case 'create_directory':
        await fileService.createFolder(parameters.path);
        result = { success: true, message: 'Directory created successfully' };
        break;
        
      case 'list_files':
        const files = await fileService.getFileTree(parameters.directory || '.');
        result = files;
        break;
        
      case 'search_code':
        const searchResults = await fileService.searchFiles(parameters.pattern, parameters.path || '.');
        result = searchResults;
        break;
        
      case 'run_command':
        // Sanitize command input to prevent injection attacks
        const sanitizedCommand = sanitizeCommand(parameters.command);
        if (!sanitizedCommand) {
          throw new Error('Invalid or potentially dangerous command');
        }
        
        const { stdout, stderr } = await execAsync(sanitizedCommand, {
          cwd: parameters.cwd || process.cwd(),
          timeout: 30000, // 30 second timeout
        });
        result = {
          stdout,
          stderr,
          success: true,
        };
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    toolCall.result = result;
    toolCall.status = 'completed';
    
  } catch (error: any) {
    toolCall.status = 'failed';
    toolCall.error = error.message;
    toolCall.result = { error: error.message };
  }
  
  return toolCall;
}

export function getToolDefinitions(): ToolDefinition[] {
  return TOOLS;
}

export function validateToolCall(toolCall: ToolCall): boolean {
  const tool = TOOLS.find(t => t.name === toolCall.name);
  if (!tool) return false;
  
  // Check required parameters
  for (const required of tool.parameters.required) {
    if (!(required in toolCall.parameters)) {
      return false;
    }
  }
  
  return true;
}

