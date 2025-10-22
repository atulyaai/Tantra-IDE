import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileAPI } from '../../services/api';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import FileNode from './FileNode';
import { Folder, RefreshCw } from 'lucide-react';

export default function FileTree() {
  const fileTree = useFileStore((state) => state.fileTree);
  const setFileTree = useFileStore((state) => state.setFileTree);
  const openTab = useEditorStore((state) => state.openTab);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['file-tree'],
    queryFn: () => fileAPI.getTree('.'),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (data) {
      setFileTree(data);
    }
  }, [data, setFileTree]);

  const handleFileClick = async (path: string, name: string) => {
    try {
      const fileContent = await fileAPI.readFile(path);
      
      // Detect language from extension
      const ext = name.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        json: 'json',
        html: 'html',
        css: 'css',
        scss: 'scss',
        md: 'markdown',
        yaml: 'yaml',
        yml: 'yaml',
        sh: 'shell',
        rs: 'rust',
        go: 'go',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        php: 'php',
        rb: 'ruby',
        sql: 'sql',
        xml: 'xml',
      };

      openTab({
        path: fileContent.path,
        name,
        content: fileContent.content,
        language: languageMap[ext || ''] || 'plaintext',
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Folder className="w-4 h-4" />
          <span>Files</span>
        </div>
        <button
          className="p-1 hover:bg-accent rounded"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground px-2">Loading...</div>
      ) : fileTree.length === 0 ? (
        <div className="text-sm text-muted-foreground px-2">
          No files found. Open a folder to get started.
        </div>
      ) : (
        <div>
          {fileTree.map((node) => (
            <FileNode
              key={node.path}
              node={node}
              onFileClick={handleFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

