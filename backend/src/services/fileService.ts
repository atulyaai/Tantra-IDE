import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: number;
}

export async function getFileTree(relativePath: string): Promise<FileNode[]> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const nodes: FileNode[] = [];
    
    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      const entryPath = path.join(relativePath, entry.name);
      const fullEntryPath = path.join(fullPath, entry.name);
      
      const stats = await fs.stat(fullEntryPath);
      
      const node: FileNode = {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtimeMs,
      };
      
      if (entry.isDirectory()) {
        // Recursively get children
        node.children = await getFileTree(entryPath);
      }
      
      nodes.push(node);
    }
    
    // Sort: directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading directory ${fullPath}:`, error);
    return [];
  }
}

export async function readFile(relativePath: string): Promise<string> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  return await fs.readFile(fullPath, 'utf-8');
}

export async function writeFile(relativePath: string, content: string): Promise<void> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  
  await fs.writeFile(fullPath, content, 'utf-8');
}

export async function createFile(relativePath: string, content: string = ''): Promise<void> {
  await writeFile(relativePath, content);
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  const stats = await fs.stat(fullPath);
  
  if (stats.isDirectory()) {
    await fs.rm(fullPath, { recursive: true });
  } else {
    await fs.unlink(fullPath);
  }
}

export async function renameFile(oldRelativePath: string, newRelativePath: string): Promise<void> {
  const oldFullPath = path.join(WORKSPACE_PATH, oldRelativePath);
  const newFullPath = path.join(WORKSPACE_PATH, newRelativePath);
  
  await fs.rename(oldFullPath, newFullPath);
}

export async function createFolder(relativePath: string): Promise<void> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  await fs.mkdir(fullPath, { recursive: true });
}

export async function searchFiles(pattern: string, relativePath: string = '.'): Promise<any[]> {
  const fullPath = path.join(WORKSPACE_PATH, relativePath);
  
  try {
    // Try using ripgrep first (faster)
    const { stdout } = await execAsync(
      `rg "${pattern}" --json "${fullPath}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    const results = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(result => result && result.type === 'match');
    
    return results;
  } catch (error) {
    // Fallback to grep
    try {
      const { stdout } = await execAsync(
        `grep -r "${pattern}" "${fullPath}"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      
      return stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [file, ...rest] = line.split(':');
          return {
            path: file,
            line: rest.join(':'),
          };
        });
    } catch {
      return [];
    }
  }
}

