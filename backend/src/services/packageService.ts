import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  latest?: string;
  outdated: boolean;
  dependencies?: Record<string, string>;
}

export interface DependencyTree {
  name: string;
  version: string;
  dependencies: DependencyTree[];
}

export async function detectPackageManager(): Promise<string | null> {
  try {
    const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');
    const requirementsPath = path.join(WORKSPACE_PATH, 'requirements.txt');
    const cargoPath = path.join(WORKSPACE_PATH, 'Cargo.toml');
    const goModPath = path.join(WORKSPACE_PATH, 'go.mod');
    
    if (await fileExists(packageJsonPath)) return 'npm';
    if (await fileExists(requirementsPath)) return 'pip';
    if (await fileExists(cargoPath)) return 'cargo';
    if (await fileExists(goModPath)) return 'go';
    
    return null;
  } catch {
    return null;
  }
}

export async function detectMissingDependencies(): Promise<string[]> {
  const manager = await detectPackageManager();
  if (!manager) return [];
  
  try {
    switch (manager) {
      case 'npm':
        return await detectMissingNpmDeps();
      case 'pip':
        return await detectMissingPipDeps();
      case 'cargo':
        return await detectMissingCargoDeps();
      case 'go':
        return await detectMissingGoDeps();
      default:
        return [];
    }
  } catch (error) {
    console.error('Error detecting missing dependencies:', error);
    return [];
  }
}

async function detectMissingNpmDeps(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('npm ls --depth=0 --json', {
      cwd: WORKSPACE_PATH,
    });
    
    const packageJson = JSON.parse(await fs.readFile(path.join(WORKSPACE_PATH, 'package.json'), 'utf-8'));
    const installed = JSON.parse(stdout);
    
    const missing: string[] = [];
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const [name, version] of Object.entries(dependencies)) {
      if (!installed.dependencies?.[name]) {
        missing.push(name);
      }
    }
    
    return missing;
  } catch {
    return [];
  }
}

async function detectMissingPipDeps(): Promise<string[]> {
  try {
    const requirements = await fs.readFile(path.join(WORKSPACE_PATH, 'requirements.txt'), 'utf-8');
    const packages = requirements.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('==')[0].split('>=')[0].split('<=')[0]);
    
    const missing: string[] = [];
    
    for (const pkg of packages) {
      try {
        await execAsync(`python -c "import ${pkg}"`);
      } catch {
        missing.push(pkg);
      }
    }
    
    return missing;
  } catch {
    return [];
  }
}

async function detectMissingCargoDeps(): Promise<string[]> {
  try {
    await execAsync('cargo check', { cwd: WORKSPACE_PATH });
    return [];
  } catch {
    return ['cargo dependencies'];
  }
}

async function detectMissingGoDeps(): Promise<string[]> {
  try {
    await execAsync('go mod tidy', { cwd: WORKSPACE_PATH });
    return [];
  } catch {
    return ['go dependencies'];
  }
}

export async function installPackage(packageName: string, manager: string = 'npm'): Promise<void> {
  try {
    let command: string;
    
    switch (manager) {
      case 'npm':
        command = `npm install ${packageName}`;
        break;
      case 'pip':
        command = `pip install ${packageName}`;
        break;
      case 'cargo':
        command = `cargo add ${packageName}`;
        break;
      case 'go':
        command = `go get ${packageName}`;
        break;
      default:
        throw new Error(`Unsupported package manager: ${manager}`);
    }
    
    await execAsync(command, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error(`Error installing package ${packageName}:`, error);
    throw error;
  }
}

export async function getDependencyTree(manager: string = 'npm'): Promise<DependencyTree | null> {
  try {
    switch (manager) {
      case 'npm':
        return await getNpmDependencyTree();
      case 'pip':
        return await getPipDependencyTree();
      case 'cargo':
        return await getCargoDependencyTree();
      case 'go':
        return await getGoDependencyTree();
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting dependency tree:', error);
    return null;
  }
}

async function getNpmDependencyTree(): Promise<DependencyTree | null> {
  try {
    const { stdout } = await execAsync('npm ls --json', { cwd: WORKSPACE_PATH });
    const tree = JSON.parse(stdout);
    
    return {
      name: tree.name || 'root',
      version: tree.version || '1.0.0',
      dependencies: Object.values(tree.dependencies || {}).map((dep: any) => ({
        name: dep.name,
        version: dep.version,
        dependencies: Object.values(dep.dependencies || {}).map((subDep: any) => ({
          name: subDep.name,
          version: subDep.version,
          dependencies: [],
        })),
      })),
    };
  } catch {
    return null;
  }
}

async function getPipDependencyTree(): Promise<DependencyTree | null> {
  try {
    const { stdout } = await execAsync('pip list --format=json', { cwd: WORKSPACE_PATH });
    const packages = JSON.parse(stdout);
    
    return {
      name: 'python-packages',
      version: '1.0.0',
      dependencies: packages.map((pkg: any) => ({
        name: pkg.name,
        version: pkg.version,
        dependencies: [],
      })),
    };
  } catch {
    return null;
  }
}

async function getCargoDependencyTree(): Promise<DependencyTree | null> {
  try {
    const { stdout } = await execAsync('cargo tree --format "{p} {v}"', { cwd: WORKSPACE_PATH });
    const lines = stdout.split('\n').filter(line => line.trim());
    
    return {
      name: 'cargo-dependencies',
      version: '1.0.0',
      dependencies: lines.map(line => {
        const [name, version] = line.split(' ');
        return {
          name,
          version,
          dependencies: [],
        };
      }),
    };
  } catch {
    return null;
  }
}

async function getGoDependencyTree(): Promise<DependencyTree | null> {
  try {
    const { stdout } = await execAsync('go list -m all', { cwd: WORKSPACE_PATH });
    const lines = stdout.split('\n').filter(line => line.trim());
    
    return {
      name: 'go-modules',
      version: '1.0.0',
      dependencies: lines.map(line => {
        const parts = line.split(' ');
        return {
          name: parts[0],
          version: parts[1] || 'latest',
          dependencies: [],
        };
      }),
    };
  } catch {
    return null;
  }
}

export async function updatePackages(manager: string = 'npm'): Promise<void> {
  try {
    let command: string;
    
    switch (manager) {
      case 'npm':
        command = 'npm update';
        break;
      case 'pip':
        command = 'pip install --upgrade pip && pip list --outdated --format=freeze | grep -v "^\-e" | cut -d = -f 1 | xargs -n1 pip install -U';
        break;
      case 'cargo':
        command = 'cargo update';
        break;
      case 'go':
        command = 'go get -u ./...';
        break;
      default:
        throw new Error(`Unsupported package manager: ${manager}`);
    }
    
    await execAsync(command, { cwd: WORKSPACE_PATH });
  } catch (error) {
    console.error('Error updating packages:', error);
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

