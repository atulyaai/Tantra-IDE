import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { 
  FileText, 
  MessageSquare, 
  Terminal, 
  GitBranch, 
  Shield, 
  Package, 
  Image, 
  Rocket,
  Search, 
  Database, 
  Zap,
  Bot,
  Mic,
  Settings 
} from 'lucide-react';

interface SidebarProps {
  onPanelChange?: (panelId: string) => void;
}

export default function Sidebar({ onPanelChange }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('files');
  const isStreaming = useChatStore((state) => state.isStreaming);

  const tabs = [
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'git', label: 'Git', icon: GitBranch },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'deployment', label: 'Deploy', icon: Rocket },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'agent', label: 'Agent', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    
    // Notify parent component about panel change
    if (onPanelChange) {
      onPanelChange(tabId);
    }
    
    // Handle special cases
    if (tabId === 'files') {
      // Files tab is handled by the main layout
      return;
    }
    
    // For other tabs, you would typically open them in a panel
    // For now, we'll just set the active tab
  };

  return (
    <div className="w-12 bg-card border-r border-border flex flex-col">
      <div className="p-2">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
          T
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.id === 'chat' && isStreaming;
          
          return (
            <button
              key={tab.id}
              className={`w-12 h-12 flex items-center justify-center relative group ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && handleTabClick(tab.id)}
              disabled={isDisabled}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tab.label}
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="p-2">
        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground">
          <Settings className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
