import { useState } from 'react';
import FileExplorer from '../FileExplorer/FileTree';
import MonacoEditor from '../Editor/MonacoEditor';
import ChatPanel from '../AIAssistant/ChatPanel';
import TerminalPanel from '../Terminal/TerminalPanel';
import StatusBar from './StatusBar';
import { Menu, Code2, MessageSquare, Terminal, Settings } from 'lucide-react';

export default function MainLayout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [showTerminal, setShowTerminal] = useState(true);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center px-4 gap-4 bg-card">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">Tantra IDE</h1>
        </div>
        
        <div className="flex-1" />
        
        <button className="p-2 hover:bg-accent rounded">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <div 
          className="border-r border-border overflow-hidden flex flex-col"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <div className="h-10 border-b border-border flex items-center px-3 bg-card">
            <Menu className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Explorer</span>
          </div>
          <FileExplorer />
        </div>

        {/* Resize Handle - Left */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize"
          onMouseDown={(e) => {
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
          }}
        />

        {/* Center - Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor />
          </div>

          {/* Terminal Panel */}
          {showTerminal && (
            <>
              {/* Resize Handle - Bottom */}
              <div
                className="h-1 bg-border hover:bg-primary cursor-row-resize"
                onMouseDown={(e) => {
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
                }}
              />

              <div 
                className="border-t border-border overflow-hidden flex flex-col"
                style={{ height: `${bottomPanelHeight}px` }}
              >
                <div className="h-10 border-b border-border flex items-center px-3 bg-card">
                  <Terminal className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Terminal</span>
                  <button 
                    className="ml-auto p-1 hover:bg-accent rounded"
                    onClick={() => setShowTerminal(false)}
                  >
                    ×
                  </button>
                </div>
                <TerminalPanel />
              </div>
            </>
          )}
        </div>

        {/* Resize Handle - Right */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize"
          onMouseDown={(e) => {
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
          }}
        />

        {/* Right Sidebar - AI Chat */}
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

      {/* Show Terminal Button (when hidden) */}
      {!showTerminal && (
        <button
          className="fixed bottom-4 right-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setShowTerminal(true)}
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

