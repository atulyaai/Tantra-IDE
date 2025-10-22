import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'aws' | 'github-pages';
  projectName: string;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
  customDomain?: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  url?: string;
  logs?: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface PlatformInfo {
  name: string;
  supported: boolean;
  installed: boolean;
  version?: string;
}

// Vercel Deployment
export async function deployToVercel(config: DeploymentConfig): Promise<DeploymentStatus> {
  try {
    // Check if Vercel CLI is installed
    try {
      await execAsync('vercel --version', { cwd: WORKSPACE_PATH });
    } catch {
      // Install Vercel CLI
      await execAsync('npm install -g vercel', { cwd: WORKSPACE_PATH });
    }

    // Create vercel.json if it doesn't exist
    const vercelConfigPath = path.join(WORKSPACE_PATH, 'vercel.json');
    try {
      await fs.access(vercelConfigPath);
    } catch {
      const vercelConfig = {
        version: 2,
        builds: [
          {
            src: config.outputDirectory ? `${config.outputDirectory}/**/*` : '**/*',
            use: '@vercel/static',
          },
        ],
        routes: [
          {
            src: '/(.*)',
            dest: config.outputDirectory ? `/${config.outputDirectory}/$1` : '/$1',
          },
        ],
      };
      await fs.writeFile(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    }

    // Set environment variables
    if (config.environmentVariables) {
      for (const [key, value] of Object.entries(config.environmentVariables)) {
        await execAsync(`vercel env add ${key} ${value}`, { cwd: WORKSPACE_PATH });
      }
    }

    // Deploy
    const { stdout } = await execAsync('vercel --prod --yes', { cwd: WORKSPACE_PATH });
    
    // Extract URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : undefined;

    return {
      id: `vercel-${Date.now()}`,
      status: 'deployed',
      url,
      logs: [stdout],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  } catch (error: any) {
    return {
      id: `vercel-${Date.now()}`,
      status: 'failed',
      logs: [error.message],
      createdAt: new Date(),
    };
  }
}

// Netlify Deployment
export async function deployToNetlify(config: DeploymentConfig): Promise<DeploymentStatus> {
  try {
    // Check if Netlify CLI is installed
    try {
      await execAsync('netlify --version', { cwd: WORKSPACE_PATH });
    } catch {
      // Install Netlify CLI
      await execAsync('npm install -g netlify-cli', { cwd: WORKSPACE_PATH });
    }

    // Create netlify.toml if it doesn't exist
    const netlifyConfigPath = path.join(WORKSPACE_PATH, 'netlify.toml');
    try {
      await fs.access(netlifyConfigPath);
    } catch {
      const netlifyConfig = `
[build]
  publish = "${config.outputDirectory || 'dist'}"
  command = "${config.buildCommand || 'npm run build'}"

[build.environment]
${Object.entries(config.environmentVariables || {}).map(([key, value]) => `  ${key} = "${value}"`).join('\n')}

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
      await fs.writeFile(netlifyConfigPath, netlifyConfig);
    }

    // Deploy
    const { stdout } = await execAsync('netlify deploy --prod', { cwd: WORKSPACE_PATH });
    
    // Extract URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : undefined;

    return {
      id: `netlify-${Date.now()}`,
      status: 'deployed',
      url,
      logs: [stdout],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  } catch (error: any) {
    return {
      id: `netlify-${Date.now()}`,
      status: 'failed',
      logs: [error.message],
      createdAt: new Date(),
    };
  }
}

// AWS S3 + CloudFront Deployment
export async function deployToAWS(config: DeploymentConfig): Promise<DeploymentStatus> {
  try {
    // Check if AWS CLI is installed
    try {
      await execAsync('aws --version', { cwd: WORKSPACE_PATH });
    } catch {
      throw new Error('AWS CLI not installed. Please install AWS CLI first.');
    }

    const bucketName = `${config.projectName}-${Date.now()}`;
    const region = 'us-east-1';

    // Create S3 bucket
    await execAsync(`aws s3 mb s3://${bucketName} --region ${region}`, { cwd: WORKSPACE_PATH });

    // Upload files
    const sourceDir = config.outputDirectory || 'dist';
    await execAsync(`aws s3 sync ${sourceDir} s3://${bucketName} --delete`, { cwd: WORKSPACE_PATH });

    // Configure bucket for static website hosting
    await execAsync(`aws s3 website s3://${bucketName} --index-document index.html --error-document error.html`, { cwd: WORKSPACE_PATH });

    // Set bucket policy for public read
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };

    await fs.writeFile('bucket-policy.json', JSON.stringify(bucketPolicy));
    await execAsync(`aws s3api put-bucket-policy --bucket ${bucketName} --policy file://bucket-policy.json`, { cwd: WORKSPACE_PATH });
    await fs.unlink('bucket-policy.json');

    const url = `http://${bucketName}.s3-website-${region}.amazonaws.com`;

    return {
      id: `aws-${Date.now()}`,
      status: 'deployed',
      url,
      logs: [`Deployed to S3 bucket: ${bucketName}`],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  } catch (error: any) {
    return {
      id: `aws-${Date.now()}`,
      status: 'failed',
      logs: [error.message],
      createdAt: new Date(),
    };
  }
}

// GitHub Pages Deployment
export async function deployToGitHubPages(config: DeploymentConfig): Promise<DeploymentStatus> {
  try {
    // Check if we're in a git repository
    try {
      await execAsync('git status', { cwd: WORKSPACE_PATH });
    } catch {
      throw new Error('Not a git repository. Please initialize git first.');
    }

    // Create gh-pages branch if it doesn't exist
    try {
      await execAsync('git checkout gh-pages', { cwd: WORKSPACE_PATH });
    } catch {
      await execAsync('git checkout -b gh-pages', { cwd: WORKSPACE_PATH });
    }

    // Build the project
    if (config.buildCommand) {
      await execAsync(config.buildCommand, { cwd: WORKSPACE_PATH });
    }

    // Copy build output to root
    const sourceDir = config.outputDirectory || 'dist';
    await execAsync(`cp -r ${sourceDir}/* .`, { cwd: WORKSPACE_PATH });

    // Commit and push
    await execAsync('git add .', { cwd: WORKSPACE_PATH });
    await execAsync('git commit -m "Deploy to GitHub Pages"', { cwd: WORKSPACE_PATH });
    await execAsync('git push origin gh-pages', { cwd: WORKSPACE_PATH });

    // Switch back to main branch
    await execAsync('git checkout main', { cwd: WORKSPACE_PATH });

    const url = `https://${config.projectName}.github.io`;

    return {
      id: `github-pages-${Date.now()}`,
      status: 'deployed',
      url,
      logs: ['Deployed to GitHub Pages'],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  } catch (error: any) {
    return {
      id: `github-pages-${Date.now()}`,
      status: 'failed',
      logs: [error.message],
      createdAt: new Date(),
    };
  }
}

// Main deployment function
export async function deployProject(config: DeploymentConfig): Promise<DeploymentStatus> {
  switch (config.platform) {
    case 'vercel':
      return await deployToVercel(config);
    case 'netlify':
      return await deployToNetlify(config);
    case 'aws':
      return await deployToAWS(config);
    case 'github-pages':
      return await deployToGitHubPages(config);
    default:
      throw new Error(`Unsupported platform: ${config.platform}`);
  }
}

// Check platform availability
export async function checkPlatformAvailability(): Promise<PlatformInfo[]> {
  const platforms: PlatformInfo[] = [
    { name: 'vercel', supported: true, installed: false },
    { name: 'netlify', supported: true, installed: false },
    { name: 'aws', supported: true, installed: false },
    { name: 'github-pages', supported: true, installed: false },
  ];

  for (const platform of platforms) {
    try {
      switch (platform.name) {
        case 'vercel':
          const vercelVersion = await execAsync('vercel --version', { cwd: WORKSPACE_PATH });
          platform.installed = true;
          platform.version = vercelVersion.stdout.trim();
          break;
        case 'netlify':
          const netlifyVersion = await execAsync('netlify --version', { cwd: WORKSPACE_PATH });
          platform.installed = true;
          platform.version = netlifyVersion.stdout.trim();
          break;
        case 'aws':
          const awsVersion = await execAsync('aws --version', { cwd: WORKSPACE_PATH });
          platform.installed = true;
          platform.version = awsVersion.stdout.trim();
          break;
        case 'github-pages':
          // GitHub Pages doesn't need CLI, just git
          try {
            await execAsync('git --version', { cwd: WORKSPACE_PATH });
            platform.installed = true;
          } catch {
            platform.installed = false;
          }
          break;
      }
    } catch {
      platform.installed = false;
    }
  }

  return platforms;
}

// Auto-detect deployment configuration
export async function detectDeploymentConfig(): Promise<DeploymentConfig | null> {
  try {
    // Check for package.json
    const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    // Detect framework
    let platform: DeploymentConfig['platform'] = 'vercel';
    let buildCommand = 'npm run build';
    let outputDirectory = 'dist';

    if (packageJson.dependencies?.next) {
      platform = 'vercel';
      outputDirectory = '.next';
    } else if (packageJson.dependencies?.react) {
      platform = 'netlify';
      outputDirectory = 'build';
    } else if (packageJson.dependencies?.vue) {
      platform = 'netlify';
      outputDirectory = 'dist';
    } else if (packageJson.dependencies?.nuxt) {
      platform = 'vercel';
      outputDirectory = '.nuxt';
    }

    return {
      platform,
      projectName: packageJson.name || 'my-project',
      buildCommand,
      outputDirectory,
      environmentVariables: {},
    };
  } catch {
    return null;
  }
}

// Get deployment history
export async function getDeploymentHistory(): Promise<DeploymentStatus[]> {
  // In a real implementation, this would read from a database
  // For now, return empty array
  return [];
}

