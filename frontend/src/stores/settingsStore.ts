import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  autoSave: true,
  aiModel: 'qwen2.5-coder:7b',
  aiTemperature: 0.7,
  ollamaUrl: 'http://localhost:11434',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings,
      })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'tantra-ide-settings',
    }
  )
);

