import { create } from 'zustand';
import type { FileNode } from '../types';

interface FileState {
  rootPath: string | null;
  fileTree: FileNode[];
  selectedPath: string | null;
  expandedPaths: Set<string>;
  
  // Actions
  setRootPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setSelectedPath: (path: string | null) => void;
  toggleExpanded: (path: string) => void;
  updateNode: (path: string, updates: Partial<FileNode>) => void;
}

export const useFileStore = create<FileState>((set) => ({
  rootPath: null,
  fileTree: [],
  selectedPath: null,
  expandedPaths: new Set(),

  setRootPath: (path) => set({ rootPath: path }),

  setFileTree: (tree) => set({ fileTree: tree }),

  setSelectedPath: (path) => set({ selectedPath: path }),

  toggleExpanded: (path) => set((state) => {
    const newExpanded = new Set(state.expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    return { expandedPaths: newExpanded };
  }),

  updateNode: (path, updates) => set((state) => {
    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map(node => {
        if (node.path === path) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });

    return { fileTree: updateTree(state.fileTree) };
  }),
}));

