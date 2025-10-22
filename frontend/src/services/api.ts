import axios from 'axios';
import type { FileNode, FileContent, GitChange, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// File Operations
export const fileAPI = {
  getTree: async (path: string = '.'): Promise<FileNode[]> => {
    const { data } = await api.get<ApiResponse<FileNode[]>>('/files/tree', {
      params: { path },
    });
    return data.data || [];
  },

  readFile: async (path: string): Promise<FileContent> => {
    const { data } = await api.get<ApiResponse<FileContent>>('/files/read', {
      params: { path },
    });
    return data.data!;
  },

  writeFile: async (path: string, content: string): Promise<void> => {
    await api.post('/files/write', { path, content });
  },

  createFile: async (path: string, content: string = ''): Promise<void> => {
    await api.post('/files/create', { path, content });
  },

  deleteFile: async (path: string): Promise<void> => {
    await api.delete('/files/delete', { params: { path } });
  },

  renameFile: async (oldPath: string, newPath: string): Promise<void> => {
    await api.post('/files/rename', { oldPath, newPath });
  },

  createFolder: async (path: string): Promise<void> => {
    await api.post('/files/create-folder', { path });
  },

  search: async (pattern: string, path: string = '.'): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/files/search', {
      params: { pattern, path },
    });
    return data.data || [];
  },
};

// Git Operations
export const gitAPI = {
  status: async (): Promise<GitChange[]> => {
    const { data } = await api.get<ApiResponse<GitChange[]>>('/git/status');
    return data.data || [];
  },

  diff: async (path?: string): Promise<string> => {
    const { data } = await api.get<ApiResponse<string>>('/git/diff', {
      params: { path },
    });
    return data.data || '';
  },

  commit: async (message: string, files?: string[]): Promise<void> => {
    await api.post('/git/commit', { message, files });
  },

  push: async (remote: string = 'origin', branch: string = 'main'): Promise<void> => {
    await api.post('/git/push', { remote, branch });
  },

  pull: async (remote: string = 'origin', branch: string = 'main'): Promise<void> => {
    await api.post('/git/pull', { remote, branch });
  },

  getCurrentBranch: async (): Promise<string> => {
    const { data } = await api.get<ApiResponse<string>>('/git/branch');
    return data.data || 'main';
  },

  getBranches: async (): Promise<string[]> => {
    const { data } = await api.get<ApiResponse<string[]>>('/git/branches');
    return data.data || [];
  },

  createBranch: async (name: string): Promise<void> => {
    await api.post('/git/branch', { name, action: 'create' });
  },

  switchBranch: async (name: string): Promise<void> => {
    await api.post('/git/branch', { name, action: 'switch' });
  },

  getHistory: async (limit: number = 10): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/git/history', {
      params: { limit },
    });
    return data.data || [];
  },
};

// Package Operations
export const packageAPI = {
  detectMissing: async (): Promise<string[]> => {
    const { data } = await api.get<ApiResponse<string[]>>('/packages/detect-missing');
    return data.data || [];
  },

  install: async (packageName: string, manager: string = 'npm'): Promise<void> => {
    await api.post('/packages/install', { packageName, manager });
  },

  getTree: async (manager?: string): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>('/packages/tree', {
      params: { manager },
    });
    return data.data;
  },

  update: async (manager: string = 'npm'): Promise<void> => {
    await api.post('/packages/update', { manager });
  },

  detectManager: async (): Promise<string | null> => {
    const { data } = await api.get<ApiResponse<string | null>>('/packages/manager');
    return data.data;
  },
};

// Security Operations
export const securityAPI = {
  scan: async (type: 'dependencies' | 'code' | 'all' = 'all'): Promise<any[]> => {
    const { data } = await api.post<ApiResponse<any[]>>('/security/scan', { type });
    return data.data || [];
  },

  fix: async (vulnerabilityId: string, manager: string = 'npm'): Promise<void> => {
    await api.post('/security/fix', { vulnerabilityId, manager });
  },

  getCVE: async (cveId: string): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>(`/security/cve/${cveId}`);
    return data.data;
  },
};

// Media Operations
export const mediaAPI = {
  getAll: async (): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/media/all');
    return data.data || [];
  },

  tag: async (path: string): Promise<string[]> => {
    const { data } = await api.post<ApiResponse<string[]>>('/media/tag', { path });
    return data.data || [];
  },

  optimize: async (path: string, options?: any): Promise<void> => {
    await api.post('/media/optimize', { path, options });
  },

  findUsage: async (path: string): Promise<string[]> => {
    const { data } = await api.post<ApiResponse<string[]>>('/media/find-usage', { path });
    return data.data || [];
  },

  getStats: async (): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>('/media/stats');
    return data.data;
  },

  getUnused: async (): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/media/unused');
    return data.data || [];
  },
};

// Deployment Operations
export const deploymentAPI = {
  deploy: async (platform: string, config: any): Promise<any> => {
    const { data } = await api.post<ApiResponse<any>>('/deployment/deploy', {
      platform,
      ...config,
    });
    return data.data;
  },

  getPlatforms: async (): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/deployment/platforms');
    return data.data || [];
  },

  getConfig: async (): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>('/deployment/config');
    return data.data;
  },

  getHistory: async (): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/deployment/history');
    return data.data || [];
  },

  installCLI: async (platform: string): Promise<void> => {
    await api.post('/deployment/install-cli', { platform });
  },
};

// Search Operations
export const searchAPI = {
  web: async (query: string, source: string = 'all', options: any = {}): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/search/web', {
      params: { query, source, ...options },
    });
    return data.data || [];
  },

  suggestions: async (query: string): Promise<string[]> => {
    const { data } = await api.get<ApiResponse<string[]>>('/search/suggestions', {
      params: { q: query },
    });
    return data.data || [];
  },

  code: async (query: string, language?: string): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/search/code', {
      params: { query, language },
    });
    return data.data || [];
  },

  docs: async (query: string, framework?: string): Promise<any[]> => {
    const { data } = await api.get<ApiResponse<any[]>>('/search/docs', {
      params: { query, framework },
    });
    return data.data || [];
  },
};

export default api;

