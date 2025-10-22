import { create } from 'zustand';
import type { EditorTab, DiffChange } from '../types';

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  diffs: DiffChange[];
  
  // Actions
  openTab: (tab: Omit<EditorTab, 'id' | 'modified'>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabSaved: (id: string) => void;
  addDiff: (diff: DiffChange) => void;
  approveDiff: (path: string) => void;
  rejectDiff: (path: string) => void;
  clearDiffs: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  tabs: [],
  activeTabId: null,
  diffs: [],

  openTab: (tab) => set((state) => {
    const existingTab = state.tabs.find(t => t.path === tab.path);
    if (existingTab) {
      return { activeTabId: existingTab.id };
    }
    
    const newTab: EditorTab = {
      ...tab,
      id: `tab-${Date.now()}`,
      modified: false,
    };
    
    return {
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    };
  }),

  closeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id);
    const newActiveId = state.activeTabId === id
      ? (newTabs[0]?.id || null)
      : state.activeTabId;
    
    return { tabs: newTabs, activeTabId: newActiveId };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) => set((state) => ({
    tabs: state.tabs.map(tab =>
      tab.id === id
        ? { ...tab, content, modified: true }
        : tab
    ),
  })),

  markTabSaved: (id) => set((state) => ({
    tabs: state.tabs.map(tab =>
      tab.id === id ? { ...tab, modified: false } : tab
    ),
  })),

  addDiff: (diff) => set((state) => ({
    diffs: [...state.diffs, diff],
  })),

  approveDiff: (path) => set((state) => ({
    diffs: state.diffs.map(d =>
      d.path === path ? { ...d, approved: true } : d
    ),
  })),

  rejectDiff: (path) => set((state) => ({
    diffs: state.diffs.filter(d => d.path !== path),
  })),

  clearDiffs: () => set({ diffs: [] }),
}));

