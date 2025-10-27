import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.css', '.scss', '.html', '.xml',
  '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
  '.kt', '.scala', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.yml', '.yaml',
  '.toml', '.ini', '.cfg', '.conf', '.env', '.gitignore', '.dockerfile', '.sql'
]);

// Type definitions
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: number;
  extension?: string;
}

interface SearchResult {
  path: string;
  line: number;
  content: string;
  match: string;
}

// Utility functions
function isValidPath(inputPath: string): boolean {
  // Prevent directory traversal attacks
  if (!inputPath || typeof inputPath !== 'string') {
    return false;
  }
  
  const normalizedPath = path.normalize(inputPath);
  return !normalizedPath.includes('..') && 
         !normalizedPath.startsWith('/') && 
         !normalizedPath.includes('\\') &&
         inputPath.length < 1000; // Prevent extremely long paths
}

function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function isAllowedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.has(ext) || ext === '';
}

// Main service functions
export async function getFileTree(relativePath: string, maxDepth: number = 10): Promise<FileNode[]> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const nodes: FileNode[] = [];
    
    // Process entries in parallel for better performance
    const nodePromises = entries.map(async (entry) => {
      // Skip hidden files, node_modules, and build directories
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build' ||
          entry.name === '.git') {
        return null;
      }
      
      const entryPath = path.join(relativePath, entry.name);
      const fullEntryPath = path.join(fullPath, entry.name);
      
      try {
        const stats = await fs.stat(fullEntryPath);
        
        const node: FileNode = {
          name: entry.name,
          path: entryPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtimeMs,
          extension: entry.isFile() ? getFileExtension(entry.name) : undefined,
        };
        
        // Recursively get children for directories (with depth limit)
        if (entry.isDirectory() && entryPath.split('/').length < maxDepth) {
          try {
            node.children = await getFileTree(entryPath, maxDepth - 1);
          } catch (error) {
            console.warn(`Error reading subdirectory ${entryPath}:`, error);
            node.children = [];
          }
        }
        
        return node;
      } catch (error) {
        console.warn(`Error processing ${entryPath}:`, error);
        return null;
      }
    });
    
    const resolvedNodes = await Promise.all(nodePromises);
    const validNodes = resolvedNodes.filter((node): node is FileNode => node !== null);
    
    // Sort: directories first, then files, both alphabetically
    return validNodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading directory ${fullPath}:`, error);
    throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function readFile(relativePath: string): Promise<string> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      throw new Error('Path is not a file');
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
    }
    
    if (!isAllowedFile(relativePath)) {
      throw new Error('File type not allowed');
    }
    
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${fullPath}:`, error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function writeFile(relativePath: string, content: string): Promise<void> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    // Validate file size
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(`Content too large: ${content.length} bytes (max: ${MAX_FILE_SIZE})`);
    }
    
    if (!isAllowedFile(relativePath)) {
      throw new Error('File type not allowed');
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${fullPath}:`, error);
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createFile(relativePath: string, content: string = ''): Promise<void> {
  await writeFile(relativePath, content);
}

export async function deleteFile(relativePath: string): Promise<void> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error(`Error deleting ${fullPath}:`, error);
    throw new Error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function renameFile(oldRelativePath: string, newRelativePath: string): Promise<void> {
  if (!isValidPath(oldRelativePath) || !isValidPath(newRelativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const oldFullPath = path.join(WORKSPACE_PATH, oldRelativePath);
  const newFullPath = path.join(WORKSPACE_PATH, newRelativePath);
  
  try {
    // Check if source exists
    await fs.access(oldFullPath);
    
    // Ensure destination directory exists
    await fs.mkdir(path.dirname(newFullPath), { recursive: true });
    
    await fs.rename(oldFullPath, newFullPath);
  } catch (error) {
    console.error(`Error renaming ${oldFullPath} to ${newFullPath}:`, error);
    throw new Error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createFolder(relativePath: string): Promise<void> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    await fs.mkdir(fullPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating folder ${fullPath}:`, error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchFiles(pattern: string, relativePath: string = '.'): Promise<SearchResult[]> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    // Validate search pattern
    if (!pattern || pattern.length < 2) {
      throw new Error('Search pattern must be at least 2 characters');
    }
    
    // Escape special characters for shell safety
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Try using ripgrep first (faster and more accurate)
    try {
      const { stdout } = await execAsync(
        `rg "${escapedPattern}" --json --max-count 1000 "${fullPath}"`,
        { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
      );
      
      const results: SearchResult[] = stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'match') {
              return {
                path: parsed.data.path.text,
                line: parsed.data.line_number,
                content: parsed.data.lines.text.trim(),
                match: parsed.data.submatches[0]?.match.text || '',
              };
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter((result): result is SearchResult => result !== null);
      
      return results;
    } catch (ripgrepError) {
      console.warn('Ripgrep not available, falling back to grep:', ripgrepError);
      
      // Fallback to grep
      const { stdout } = await execAsync(
        `grep -rn --max-count 1000 "${escapedPattern}" "${fullPath}"`,
        { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
      );
      
      return stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/^([^:]+):(\d+):(.+)$/);
          if (match) {
            return {
              path: match[1],
              line: parseInt(match[2], 10),
              content: match[3].trim(),
              match: pattern,
            };
          }
          return null;
        })
        .filter((result): result is SearchResult => result !== null);
    }
  } catch (error) {
    console.error(`Error searching in ${fullPath}:`, error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Additional utility functions
export async function getFileStats(relativePath: string): Promise<{
  size: number;
  modified: number;
  created: number;
  isFile: boolean;
  isDirectory: boolean;
}> {
  if (!isValidPath(relativePath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      modified: stats.mtimeMs,
      created: stats.birthtimeMs,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    console.error(`Error getting stats for ${fullPath}:`, error);
    throw new Error(`Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function copyFile(sourcePath: string, destPath: string): Promise<void> {
  if (!isValidPath(sourcePath) || !isValidPath(destPath)) {
    throw new Error('Invalid path: potential directory traversal detected');
  }

  const sourceFullPath = path.join(WORKSPACE_PATH, sourcePath);
  const destFullPath = path.join(WORKSPACE_PATH, destPath);
  
  try {
    await fs.mkdir(path.dirname(destFullPath), { recursive: true });
    await fs.copyFile(sourceFullPath, destFullPath);
  } catch (error) {
    console.error(`Error copying ${sourcePath} to ${destPath}:`, error);
    throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

