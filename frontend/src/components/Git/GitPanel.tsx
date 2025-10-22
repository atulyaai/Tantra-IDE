import { useState } from 'react';
import { GitBranch, GitCommit, Plus, RefreshCw, Upload, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict' | null;
  diff?: string;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export default function GitPanel() {
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const queryClient = useQueryClient();

  // Fetch git status
  const { data: gitStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['git-status'],
    queryFn: () => api.get('/git/status').then(res => res.data.data),
    refetchInterval: 5000,
  });

  // Fetch git history
  const { data: gitHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['git-history'],
    queryFn: () => api.get('/git/history?limit=20').then(res => res.data.data),
  });

  // Fetch current branch
  const { data: currentBranch } = useQuery({
    queryKey: ['git-branch'],
    queryFn: () => api.get('/git/branch').then(res => res.data.data),
  });

  // Fetch branches
  useQuery({
    queryKey: ['git-branches'],
    queryFn: () => api.get('/git/branches').then(res => res.data.data),
  });

  // Commit mutation
  const commitMutation = useMutation({
    mutationFn: (data: { message: string; files?: string[] }) => 
      api.post('/git/commit', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-status'] });
      queryClient.invalidateQueries({ queryKey: ['git-history'] });
      setCommitMessage('');
      setSelectedFiles([]);
    },
  });

  // Push mutation
  const pushMutation = useMutation({
    mutationFn: (data: { remote?: string; branch?: string }) => 
      api.post('/git/push', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-history'] });
    },
  });

  // Pull mutation
  const pullMutation = useMutation({
    mutationFn: (data: { remote?: string; branch?: string }) => 
      api.post('/git/pull', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-status'] });
      queryClient.invalidateQueries({ queryKey: ['git-history'] });
    },
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: (data: { name: string; action: string }) => 
      api.post('/git/branch', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-branch'] });
      queryClient.invalidateQueries({ queryKey: ['git-branches'] });
      setNewBranchName('');
      setShowNewBranch(false);
    },
  });

  const handleFileSelect = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    );
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    
    commitMutation.mutate({
      message: commitMessage,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
    });
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    
    createBranchMutation.mutate({
      name: newBranchName,
      action: 'create',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'modified': return 'text-yellow-500';
      case 'added': return 'text-green-500';
      case 'deleted': return 'text-red-500';
      case 'untracked': return 'text-blue-500';
      case 'conflict': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'untracked': return '?';
      case 'conflict': return 'U';
      default: return '?';
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            <span className="font-medium">Git</span>
            {currentBranch && (
              <span className="text-sm text-muted-foreground">
                ({currentBranch})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['git-status'] })}
              className="p-1 hover:bg-accent rounded"
              disabled={statusLoading}
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNewBranch(true)}
              className="p-1 hover:bg-accent rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Branch Management */}
        {showNewBranch && (
          <div className="mb-4 p-3 bg-accent rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New branch name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
              />
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || createBranchMutation.isPending}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewBranch(false)}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="font-medium mb-3">Changes</h3>
          {gitStatus && gitStatus.length > 0 ? (
            <div className="space-y-2">
              {gitStatus.map((change: GitChange) => (
                <div
                  key={change.path}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(change.path)}
                    onChange={() => handleFileSelect(change.path)}
                    className="rounded"
                  />
                  <span className={`text-sm font-mono ${getStatusColor(change.status || '')}`}>
                    {getStatusIcon(change.status || '')}
                  </span>
                  <span className="text-sm flex-1 truncate">{change.path}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No changes</p>
          )}
        </div>

        {/* Commit Section */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">Commit</h3>
          <div className="space-y-3">
            <textarea
              placeholder="Commit message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full p-2 text-sm bg-background border border-border rounded resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || commitMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
              >
                {commitMutation.isPending ? 'Committing...' : 'Commit'}
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => pushMutation.mutate({})}
              disabled={pushMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {pushMutation.isPending ? 'Pushing...' : 'Push'}
            </button>
            <button
              onClick={() => pullMutation.mutate({})}
              disabled={pullMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {pullMutation.isPending ? 'Pulling...' : 'Pull'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">Recent Commits</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          ) : gitHistory && gitHistory.length > 0 ? (
            <div className="space-y-2">
              {gitHistory.map((commit: GitCommit) => (
                <div key={commit.hash} className="p-2 hover:bg-accent rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <GitCommit className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {commit.hash.substring(0, 7)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {commit.date}
                    </span>
                  </div>
                  <p className="text-sm">{commit.message}</p>
                  <p className="text-xs text-muted-foreground">{commit.author}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No commits</p>
          )}
        </div>
      </div>
    </div>
  );
}