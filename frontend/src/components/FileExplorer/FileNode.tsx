import { FileNode as FileNodeType } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image,
} from 'lucide-react';

interface FileNodeProps {
  node: FileNodeType;
  level?: number;
  onFileClick: (path: string, name: string) => void;
}

export default function FileNode({ node, level = 0, onFileClick }: FileNodeProps) {
  const expandedPaths = useFileStore((state) => state.expandedPaths);
  const toggleExpanded = useFileStore((state) => state.toggleExpanded);
  const selectedPath = useFileStore((state) => state.selectedPath);
  const setSelectedPath = useFileStore((state) => state.setSelectedPath);

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    setSelectedPath(node.path);
    
    if (isDirectory) {
      toggleExpanded(node.path);
    } else {
      onFileClick(node.path, node.name);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'json') return <FileJson className="w-4 h-4 text-yellow-500" />;
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'rs', 'go'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-blue-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4 text-purple-500" />;
    }
    if (['md', 'txt'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
    
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const getGitStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'modified': return 'text-yellow-500';
      case 'added': return 'text-green-500';
      case 'deleted': return 'text-red-500';
      case 'untracked': return 'text-blue-500';
      case 'conflict': return 'text-orange-500';
      default: return '';
    }
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 px-2 py-1 cursor-pointer rounded
          hover:bg-accent
          ${isSelected ? 'bg-accent' : ''}
          ${getGitStatusColor(node.gitStatus)}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" /> {/* Spacer for alignment */}
            {getFileIcon(node.name)}
          </>
        )}
        
        <span className="text-sm truncate">{node.name}</span>
        
        {node.gitStatus && (
          <span className="ml-auto text-xs opacity-70">
            {node.gitStatus === 'modified' && 'M'}
            {node.gitStatus === 'added' && 'A'}
            {node.gitStatus === 'deleted' && 'D'}
            {node.gitStatus === 'untracked' && 'U'}
          </span>
        )}
      </div>

      {/* Render children if directory is expanded */}
      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

