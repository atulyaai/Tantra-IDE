import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();
export async function getGitStatus() {
    try {
        const { stdout } = await execAsync('git status --porcelain', {
            cwd: WORKSPACE_PATH,
        });
        const changes = [];
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        for (const line of lines) {
            const status = line.substring(0, 2);
            const filePath = line.substring(3);
            let changeStatus = null;
            if (status.includes('M'))
                changeStatus = 'modified';
            else if (status.includes('A'))
                changeStatus = 'added';
            else if (status.includes('D'))
                changeStatus = 'deleted';
            else if (status.includes('U'))
                changeStatus = 'conflict';
            else if (status.includes('?'))
                changeStatus = 'untracked';
            changes.push({
                path: filePath,
                status: changeStatus,
            });
        }
        return changes;
    }
    catch (error) {
        console.error('Git status error:', error);
        return [];
    }
}
export async function getGitDiff(filePath) {
    try {
        const command = filePath ? `git diff ${filePath}` : 'git diff';
        const { stdout } = await execAsync(command, {
            cwd: WORKSPACE_PATH,
        });
        return stdout;
    }
    catch (error) {
        console.error('Git diff error:', error);
        return '';
    }
}
export async function commitChanges(message, files) {
    try {
        if (files && files.length > 0) {
            // Add specific files
            for (const file of files) {
                await execAsync(`git add "${file}"`, { cwd: WORKSPACE_PATH });
            }
        }
        else {
            // Add all changes
            await execAsync('git add .', { cwd: WORKSPACE_PATH });
        }
        // Commit
        await execAsync(`git commit -m "${message}"`, { cwd: WORKSPACE_PATH });
    }
    catch (error) {
        console.error('Git commit error:', error);
        throw error;
    }
}
export async function pushChanges(remote = 'origin', branch = 'main') {
    try {
        await execAsync(`git push ${remote} ${branch}`, { cwd: WORKSPACE_PATH });
    }
    catch (error) {
        console.error('Git push error:', error);
        throw error;
    }
}
export async function pullChanges(remote = 'origin', branch = 'main') {
    try {
        await execAsync(`git pull ${remote} ${branch}`, { cwd: WORKSPACE_PATH });
    }
    catch (error) {
        console.error('Git pull error:', error);
        throw error;
    }
}
export async function getCurrentBranch() {
    try {
        const { stdout } = await execAsync('git branch --show-current', {
            cwd: WORKSPACE_PATH,
        });
        return stdout.trim();
    }
    catch (error) {
        console.error('Git branch error:', error);
        return 'main';
    }
}
export async function getGitHistory(limit = 10) {
    try {
        const { stdout } = await execAsync(`git log --oneline --format="%H|%s|%an|%ad" --date=short -${limit}`, { cwd: WORKSPACE_PATH });
        const commits = [];
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
    }
    catch (error) {
        console.error('Git history error:', error);
        return [];
    }
}
export async function createBranch(branchName) {
    try {
        await execAsync(`git checkout -b ${branchName}`, { cwd: WORKSPACE_PATH });
    }
    catch (error) {
        console.error('Git create branch error:', error);
        throw error;
    }
}
export async function switchBranch(branchName) {
    try {
        await execAsync(`git checkout ${branchName}`, { cwd: WORKSPACE_PATH });
    }
    catch (error) {
        console.error('Git switch branch error:', error);
        throw error;
    }
}
export async function getBranches() {
    try {
        const { stdout } = await execAsync('git branch -a', { cwd: WORKSPACE_PATH });
        return stdout
            .split('\n')
            .map(line => line.trim().replace(/^\*?\s*/, '').replace(/^remotes\/[^\/]+\//, ''))
            .filter(line => line && !line.includes('HEAD'))
            .filter((value, index, self) => self.indexOf(value) === index);
    }
    catch (error) {
        console.error('Git branches error:', error);
        return [];
    }
}
export async function isGitRepository() {
    try {
        await execAsync('git rev-parse --git-dir', { cwd: WORKSPACE_PATH });
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=gitService.js.map