import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

export interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict' | null;
  diff?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export async function getGitStatus(): Promise<GitChange[]> {
  try {
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: WORKSPACE_PATH,
    });
    
    const changes: GitChange[] = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const status = line.substring(0, 2);
      const filePath = line.substring(3);
      
      let changeStatus: GitChange['status'] = null;
      
      if (status.includes('M')) changeStatus = 'modified';
      else if (status.includes('A')) changeStatus = 'added';
      else if (status.includes('D')) changeStatus = 'deleted';
      else if (status.includes('U')) changeStatus = 'conflict';
      else if (status.includes('?')) changeStatus = 'untracked';
      
      changes.push({
        path: filePath,
        status: changeStatus,
      });
    }
    
    return changes;
  } catch (error) {
    console.error('Git status error:', error);
    return [];
  }
}

export async function getGitDiff(filePath?: string): Promise<string> {
  try {
    const command = filePath ? `git diff ${filePath}` : 'git diff';
    const { stdout } = await execAsync(command, {
      cwd: WORKSPACE_PATH,
    });
    return stdout;
  } catch (error) {
    console.error('Git diff error:', error);
    return '';
  }
}

export async function commitChanges(message: string, files?: string[]): Promise<void> {
  try {
    if (files && files.length > 0) {
      // Add specific files
      for (const file of files) {
        await execAsync(`git add "${file}"`, { cwd: WORKSPACE_PATH });
      }
    } else {
      // Add all changes
      await execAsync('git add .', { cwd: WORKSPACE_PATH });
    }
    
    // Commit
    await execAsync(`git commit -m "${message}"`, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Git commit error:', error);
    throw error;
  }
}

export async function pushChanges(remote: string = 'origin', branch: string = 'main'): Promise<void> {
  try {
    await execAsync(`git push ${remote} ${branch}`, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Git push error:', error);
    throw error;
  }
}

export async function pullChanges(remote: string = 'origin', branch: string = 'main'): Promise<void> {
  try {
    await execAsync(`git pull ${remote} ${branch}`, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Git pull error:', error);
    throw error;
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync('git branch --show-current', {
      cwd: WORKSPACE_PATH,
    });
    return stdout.trim();
  } catch (error) {
    console.error('Git branch error:', error);
    return 'main';
  }
}

export async function getGitHistory(limit: number = 10): Promise<GitCommit[]> {
  try {
    const { stdout } = await execAsync(
      `git log --oneline --format="%H|%s|%an|%ad" --date=short -${limit}`,
      { cwd: WORKSPACE_PATH }
    );
    
    const commits: GitCommit[] = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const [hash, message, author, date] = line.split('|');
      commits.push({
        hash,
        message,
        author,
        date,
      });
    }
    
    return commits;
  } catch (error) {
    console.error('Git history error:', error);
    return [];
  }
}

export async function createBranch(branchName: string): Promise<void> {
  try {
    await execAsync(`git checkout -b ${branchName}`, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Git create branch error:', error);
    throw error;
  }
}

export async function switchBranch(branchName: string): Promise<void> {
  try {
    await execAsync(`git checkout ${branchName}`, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Git switch branch error:', error);
    throw error;
  }
}

export async function getBranches(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git branch -a', { cwd: WORKSPACE_PATH });
    return stdout
      .split('\n')
      .map(line => line.trim().replace(/^\*?\s*/, '').replace(/^remotes\/[^\/]+\//, ''))
      .filter(line => line && !line.includes('HEAD'))
      .filter((value, index, self) => self.indexOf(value) === index);
  } catch (error) {
    console.error('Git branches error:', error);
    return [];
  }
}

export async function isGitRepository(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd: WORKSPACE_PATH });
    return true;
  } catch {
    return false;
  }
}

