import axios, { AxiosError, AxiosResponse } from 'axios';
import type { FileNode, FileContent, GitChange, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Generic API call wrapper with error handling
async function apiCall<T>(apiCall: () => Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  try {
    const { data } = await apiCall();
    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }
    return data.data!;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`API Error: ${message}`);
    }
    throw error;
  }
}

// File Operations API
export const fileAPI = {
  getTree: async (path: string = '.'): Promise<FileNode[]> => 
    apiCall(() => api.get<ApiResponse<FileNode[]>>('/files/tree', { params: { path } })),

  readFile: async (path: string): Promise<FileContent> => 
    apiCall(() => api.get<ApiResponse<FileContent>>('/files/read', { params: { path } })),

  writeFile: async (path: string, content: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/files/write', { path, content }));
  },

  createFile: async (path: string, content: string = ''): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/files/create', { path, content }));
  },

  deleteFile: async (path: string): Promise<void> => {
    await apiCall(() => api.delete<ApiResponse<void>>('/files/delete', { params: { path } }));
  },

  renameFile: async (oldPath: string, newPath: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/files/rename', { oldPath, newPath }));
  },

  createFolder: async (path: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/files/create-folder', { path }));
  },

  search: async (pattern: string, path: string = '.'): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/files/search', { params: { pattern, path } })),
};

// Git Operations API
export const gitAPI = {
  status: async (): Promise<GitChange[]> => 
    apiCall(() => api.get<ApiResponse<GitChange[]>>('/git/status')),

  diff: async (path?: string): Promise<string> => 
    apiCall(() => api.get<ApiResponse<string>>('/git/diff', { params: { path } })),

  commit: async (message: string, files?: string[]): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/git/commit', { message, files }));
  },

  push: async (remote: string = 'origin', branch: string = 'main'): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/git/push', { remote, branch }));
  },

  pull: async (remote: string = 'origin', branch: string = 'main'): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/git/pull', { remote, branch }));
  },

  getCurrentBranch: async (): Promise<string> => 
    apiCall(() => api.get<ApiResponse<string>>('/git/branch')),

  getBranches: async (): Promise<string[]> => 
    apiCall(() => api.get<ApiResponse<string[]>>('/git/branches')),

  createBranch: async (name: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/git/branch', { name, action: 'create' }));
  },

  switchBranch: async (name: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/git/branch', { name, action: 'switch' }));
  },

  getHistory: async (limit: number = 10): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/git/history', { params: { limit } })),
};

// Package Management API
export const packageAPI = {
  detectMissing: async (): Promise<string[]> => 
    apiCall(() => api.get<ApiResponse<string[]>>('/packages/detect-missing')),

  install: async (packageName: string, manager: string = 'npm'): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/packages/install', { packageName, manager }));
  },

  getTree: async (manager?: string): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/packages/tree', { params: { manager } })),

  update: async (manager: string = 'npm'): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/packages/update', { manager }));
  },

  detectManager: async (): Promise<string | null> => 
    apiCall(() => api.get<ApiResponse<string | null>>('/packages/manager')),
};

// Security Scanning API
export const securityAPI = {
  scan: async (type: 'dependencies' | 'code' | 'all' = 'all'): Promise<any[]> => 
    apiCall(() => api.post<ApiResponse<any[]>>('/security/scan', { type })),

  fix: async (vulnerabilityId: string, manager: string = 'npm'): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/security/fix', { vulnerabilityId, manager }));
  },

  getCVE: async (cveId: string): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>(`/security/cve/${cveId}`)),
};

// Media Management API
export const mediaAPI = {
  getAll: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/media/all')),

  tag: async (path: string): Promise<string[]> => 
    apiCall(() => api.post<ApiResponse<string[]>>('/media/tag', { path })),

  optimize: async (path: string, options?: any): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/media/optimize', { path, options }));
  },

  findUsage: async (path: string): Promise<string[]> => 
    apiCall(() => api.post<ApiResponse<string[]>>('/media/find-usage', { path })),

  getStats: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/media/stats')),

  getUnused: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/media/unused')),
};

// Deployment API
export const deploymentAPI = {
  deploy: async (platform: string, config: any): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/deployment/deploy', { platform, ...config })),

  getPlatforms: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/deployment/platforms')),

  getConfig: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/deployment/config')),

  getHistory: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/deployment/history')),

  installCLI: async (platform: string): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/deployment/install-cli', { platform }));
  },
};

// Search API
export const searchAPI = {
  web: async (query: string, source: string = 'all', options: any = {}): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/search/web', { params: { query, source, ...options } })),

  suggestions: async (query: string): Promise<string[]> => 
    apiCall(() => api.get<ApiResponse<string[]>>('/search/suggestions', { params: { q: query } })),

  code: async (query: string, language?: string): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/search/code', { params: { query, language } })),

  docs: async (query: string, framework?: string): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/search/docs', { params: { query, framework } })),
};

// Performance Analysis API
export const performanceAPI = {
  getBundleAnalysis: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/bundle')),

  getLighthouseReport: async (url?: string): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/lighthouse', { params: { url } })),

  getMemoryProfile: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/memory')),

  getCPUProfile: async (duration?: number): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/cpu', { params: { duration } })),

  getNetworkAnalysis: async (url?: string): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/network', { params: { url } })),

  getPerformanceReport: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/performance/report')),

  getOptimizationSuggestions: async (bundle: any, lighthouse: any): Promise<string[]> => 
    apiCall(() => api.post<ApiResponse<string[]>>('/performance/suggestions', { bundle, lighthouse })),
};

// Database Management API
export const databaseAPI = {
  getConnections: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/database/connections')),

  testConnection: async (connection: any): Promise<boolean> => {
    const result = await apiCall(() => api.post<ApiResponse<{ connected: boolean }>>('/database/test', { connection }));
    return result?.connected || false;
  },

  executeQuery: async (connection: any, query: string): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/database/query', { connection, query })),

  getSchema: async (connection: any): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/database/schema/1', { connection })),

  buildSelectQuery: async (table: string, columns?: string[], where?: any): Promise<string> => {
    const result = await apiCall(() => api.post<ApiResponse<{ query: string }>>('/database/query-builder/select', {
      table, columns, where,
    }));
    return result?.query || '';
  },

  buildInsertQuery: async (table: string, data: any): Promise<string> => {
    const result = await apiCall(() => api.post<ApiResponse<{ query: string }>>('/database/query-builder/insert', {
      table, data,
    }));
    return result?.query || '';
  },

  buildUpdateQuery: async (table: string, data: any, where: any): Promise<string> => {
    const result = await apiCall(() => api.post<ApiResponse<{ query: string }>>('/database/query-builder/update', {
      table, data, where,
    }));
    return result?.query || '';
  },

  buildDeleteQuery: async (table: string, where: any): Promise<string> => {
    const result = await apiCall(() => api.post<ApiResponse<{ query: string }>>('/database/query-builder/delete', {
      table, where,
    }));
    return result?.query || '';
  },
};

// AI Agent API
export const agentAPI = {
  createPlan: async (goal: string, context?: any): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/agent/plan', { goal, context })),

  executePlan: async (plan: any): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/agent/execute-plan', { plan })),

  executeTask: async (task: any, context?: any): Promise<any> => 
    apiCall(() => api.post<ApiResponse<any>>('/agent/execute-task', { task, context })),

  getPlans: async (): Promise<any[]> => 
    apiCall(() => api.get<ApiResponse<any[]>>('/agent/plans')),

  getPlan: async (id: string): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>(`/agent/plans/${id}`)),

  savePlan: async (plan: any): Promise<void> => {
    await apiCall(() => api.post<ApiResponse<void>>('/agent/plans', { plan }));
  },

  getContext: async (): Promise<any> => 
    apiCall(() => api.get<ApiResponse<any>>('/agent/context')),
};

export default api;

