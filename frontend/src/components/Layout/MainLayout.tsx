import { useState, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import FileExplorer from '../FileExplorer/FileTree';
import MonacoEditor from '../Editor/MonacoEditor';
import ChatPanel from '../AIAssistant/ChatPanel';
import TerminalPanel from '../Terminal/TerminalPanel';
import MediaBrowser from '../MediaBrowser/MediaBrowser';
import DeploymentPanel from '../Deployment/DeploymentPanel';
import SearchPanel from '../Search/SearchPanel';
import PerformancePanel from '../Performance/PerformancePanel';
import DatabasePanel from '../Database/DatabasePanel';
import AgentPanel from '../Agent/AgentPanel';
import StatusBar from './StatusBar';
import { Menu, Code2, MessageSquare, Terminal, Settings } from 'lucide-react';

// Panel configuration for better maintainability
const PANEL_CONFIG = {
  files: { title: 'Explorer', component: FileExplorer },
  media: { title: 'Media Browser', component: MediaBrowser },
  git: { title: 'Git', component: null },
  packages: { title: 'Packages', component: null },
  security: { title: 'Security', component: null },
  deployment: { title: 'Deployment', component: DeploymentPanel },
  search: { title: 'Search', component: SearchPanel },
  performance: { title: 'Performance', component: PerformancePanel },
  database: { title: 'Database', component: DatabasePanel },
  agent: { title: 'Agent', component: AgentPanel },
} as const;

type PanelKey = keyof typeof PANEL_CONFIG;

export default function MainLayout() {
  // Panel state management
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [showTerminal, setShowTerminal] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState<PanelKey>('files');

  // Memoized panel title for performance
  const leftPanelTitle = useMemo(() => 
    PANEL_CONFIG[activeLeftPanel]?.title || 'Explorer', 
    [activeLeftPanel]
  );

  // Memoized panel component for performance
  const LeftPanelComponent = useMemo(() => {
    const config = PANEL_CONFIG[activeLeftPanel];
    if (!config?.component) {
      return <div className="p-4 text-center text-muted-foreground">{config?.title} panel coming soon</div>;
    }
    return <config.component />;
  }, [activeLeftPanel]);

  // Resize handlers with useCallback for performance
  const handleLeftPanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setLeftPanelWidth(Math.max(150, Math.min(500, startWidth + delta)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  const handleRightPanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      setRightPanelWidth(Math.max(250, Math.min(600, startWidth + delta)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [rightPanelWidth]);

  const handleBottomPanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      setBottomPanelHeight(Math.max(100, Math.min(400, startHeight + delta)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [bottomPanelHeight]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Navigation Bar */}
      <div className="h-12 border-b border-border flex items-center px-4 gap-4 bg-card">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">Tantra IDE</h1>
        </div>
        <div className="flex-1" />
        <button 
          className="p-2 hover:bg-accent rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onPanelChange={setActiveLeftPanel} />
        
        {/* Left Panel - Dynamic Content */}
        <div 
          className="border-r border-border overflow-hidden flex flex-col"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <div className="h-10 border-b border-border flex items-center px-3 bg-card">
            <Menu className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{leftPanelTitle}</span>
          </div>
          {LeftPanelComponent}
        </div>

        {/* Left Resize Handle */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
          onMouseDown={handleLeftPanelResize}
        />

        {/* Center - Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor />
          </div>

          {/* Terminal Panel */}
          {showTerminal && (
            <>
              {/* Bottom Resize Handle */}
              <div
                className="h-1 bg-border hover:bg-primary cursor-row-resize transition-colors"
                onMouseDown={handleBottomPanelResize}
              />

              <div 
                className="border-t border-border overflow-hidden flex flex-col"
                style={{ height: `${bottomPanelHeight}px` }}
              >
                <div className="h-10 border-b border-border flex items-center px-3 bg-card">
                  <Terminal className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Terminal</span>
                  <button 
                    className="ml-auto p-1 hover:bg-accent rounded transition-colors"
                    onClick={() => setShowTerminal(false)}
                    title="Hide Terminal"
                  >
                    ×
                  </button>
                </div>
                <TerminalPanel />
              </div>
            </>
          )}
        </div>

        {/* Right Resize Handle */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
          onMouseDown={handleRightPanelResize}
        />

        {/* Right Panel - AI Chat */}
        <div 
          className="border-l border-border overflow-hidden flex flex-col"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="h-10 border-b border-border flex items-center px-3 bg-card">
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <ChatPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Floating Terminal Button (when hidden) */}
      {!showTerminal && (
        <button
          className="fixed bottom-4 right-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          onClick={() => setShowTerminal(true)}
          title="Show Terminal"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

