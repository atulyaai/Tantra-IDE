// File System Types
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: number;
  gitStatus?: GitStatus;
}

export interface FileContent {
  path: string;
  content: string;
  language?: string;
}

// Git Types
export type GitStatus = 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict' | null;

export interface GitChange {
  path: string;
  status: GitStatus;
  diff?: string;
}

// AI Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: MessageContext;
  toolCalls?: ToolCall[];
}

export interface MessageContext {
  files?: string[];
  folders?: string[];
  code?: string;
  terminal?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// Editor Types
export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
  cursorPosition?: { line: number; column: number };
}

export interface DiffChange {
  path: string;
  oldContent: string;
  newContent: string;
  approved: boolean;
}

// Terminal Types
export interface TerminalSession {
  id: string;
  title: string;
  active: boolean;
}

// Media Types
export interface MediaFile {
  id: string;
  path: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  tags?: string[];
  usedIn?: string[];
}

// Security Types
export interface Vulnerability {
  id: string;
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  fixAvailable: boolean;
  fixVersion?: string;
}

// Performance Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

// Package Types
export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  latest?: string;
  outdated: boolean;
  dependencies?: Record<string, string>;
}

// Deployment Types
export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'aws' | 'custom';
  projectId?: string;
  apiKey?: string;
  buildCommand?: string;
  outputDir?: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'queued' | 'building' | 'deploying' | 'ready' | 'failed';
  url?: string;
  logs?: string[];
  createdAt: number;
}

// Search Types
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'stackoverflow' | 'github' | 'npm' | 'docs';
}

// Database Types
export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  host: string;
  port: number;
  database: string;
  connected: boolean;
}

// Task Types
export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: TaskStep[];
  createdAt: number;
  completedAt?: number;
}

export interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Settings Types
export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  aiModel: string;
  aiTemperature: number;
  ollamaUrl: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket Events
export type WSEvent =
  | { type: 'chat:message'; data: Message }
  | { type: 'chat:stream'; data: { id: string; chunk: string } }
  | { type: 'file:changed'; data: { path: string } }
  | { type: 'terminal:output'; data: { sessionId: string; data: string } }
  | { type: 'tool:start'; data: ToolCall }
  | { type: 'tool:complete'; data: ToolCall }
  | { type: 'deployment:status'; data: DeploymentStatus };

