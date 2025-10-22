import { useEditorStore } from '../../stores/editorStore';
import { useChatStore } from '../../stores/chatStore';
import { Activity, GitBranch, Zap } from 'lucide-react';

export default function StatusBar() {
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const tabs = useEditorStore((state) => state.tabs);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="h-6 bg-card border-t border-border flex items-center px-3 text-xs gap-4">
      {/* Git Branch */}
      <div className="flex items-center gap-1">
        <GitBranch className="w-3 h-3" />
        <span>main</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Active File */}
      {activeTab && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">File:</span>
            <span>{activeTab.name}</span>
          </div>
          
          {activeTab.language && (
            <>
              <div className="w-px h-4 bg-border" />
              <span className="text-muted-foreground">{activeTab.language}</span>
            </>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* AI Status */}
      {isStreaming && (
        <div className="flex items-center gap-1 text-primary">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>AI Thinking...</span>
        </div>
      )}

      {/* Ollama Status */}
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3 text-green-500" />
        <span className="text-muted-foreground">Ollama Connected</span>
      </div>
    </div>
  );
}

