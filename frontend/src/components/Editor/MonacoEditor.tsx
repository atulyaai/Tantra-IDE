import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { fileAPI } from '../../services/api';
import { X, Save } from 'lucide-react';

export default function MonacoEditor() {
  const tabs = useEditorStore((state) => state.tabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const closeTab = useEditorStore((state) => state.closeTab);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);
  const updateTabContent = useEditorStore((state) => state.updateTabContent);
  const markTabSaved = useEditorStore((state) => state.markTabSaved);
  
  const theme = useSettingsStore((state) => state.theme);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const tabSize = useSettingsStore((state) => state.tabSize);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleSave = async (tab: typeof activeTab) => {
    if (!tab) return;
    
    try {
      await fileAPI.writeFile(tab.path, tab.content);
      markTabSaved(tab.id);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab) {
          handleSave(activeTab);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="h-10 border-b border-border flex items-center bg-card overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                h-full px-4 flex items-center gap-2 border-r border-border cursor-pointer
                ${tab.id === activeTabId ? 'bg-background' : 'hover:bg-accent'}
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-sm">
                {tab.name}
                {tab.modified && <span className="ml-1 text-primary">●</span>}
              </span>
              <button
                className="p-0.5 hover:bg-destructive/20 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onChange={(value) => {
              if (value !== undefined) {
                updateTabContent(activeTab.id, value);
              }
            }}
            options={{
              fontSize,
              tabSize,
              minimap: { enabled: true },
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Tantra IDE</h2>
              <p>Open a file from the explorer to start coding</p>
              <p className="text-sm mt-4">Or ask the AI assistant to generate code</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      {activeTab && (
        <div className="h-8 border-t border-border flex items-center px-3 bg-card gap-2">
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded"
            onClick={() => handleSave(activeTab)}
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <div className="text-xs text-muted-foreground">
            Ln {activeTab.cursorPosition?.line || 1}, Col {activeTab.cursorPosition?.column || 1}
          </div>
        </div>
      )}
    </div>
  );
}

