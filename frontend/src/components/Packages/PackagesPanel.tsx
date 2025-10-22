import { useState, useEffect } from 'react';
import { Package, RefreshCw, Download, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// interface PackageInfo {
//   name: string;
//   version: string;
//   description?: string;
//   latest?: string;
//   outdated: boolean;
//   dependencies?: Record<string, string>;
// }

interface DependencyTree {
  name: string;
  version: string;
  dependencies: DependencyTree[];
}

export default function PackagesPanel() {
  const [newPackage, setNewPackage] = useState('');
  const [packageManager, setPackageManager] = useState('npm');
  const [showInstallForm, setShowInstallForm] = useState(false);
  const queryClient = useQueryClient();

  // Detect package manager
  const { data: detectedManager } = useQuery({
    queryKey: ['package-manager'],
    queryFn: () => api.get('/packages/manager').then(res => res.data.data),
  });

  // Detect missing dependencies
  const { data: missingDeps, isLoading: missingLoading } = useQuery({
    queryKey: ['missing-dependencies'],
    queryFn: () => api.get('/packages/detect-missing').then(res => res.data.data),
  });

  // Get dependency tree
  const { data: dependencyTree, isLoading: treeLoading } = useQuery({
    queryKey: ['dependency-tree', packageManager],
    queryFn: () => api.get(`/packages/tree?manager=${packageManager}`).then(res => res.data.data),
  });

  // Install package mutation
  const installMutation = useMutation({
    mutationFn: (data: { packageName: string; manager: string }) => 
      api.post('/packages/install', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['dependency-tree'] });
      setNewPackage('');
      setShowInstallForm(false);
    },
  });

  // Update packages mutation
  const updateMutation = useMutation({
    mutationFn: (data: { manager: string }) => 
      api.post('/packages/update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['dependency-tree'] });
    },
  });

  useEffect(() => {
    if (detectedManager) {
      setPackageManager(detectedManager);
    }
  }, [detectedManager]);

  const handleInstall = () => {
    if (!newPackage.trim()) return;
    
    installMutation.mutate({
      packageName: newPackage,
      manager: packageManager,
    });
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      manager: packageManager,
    });
  };

  const renderDependencyTree = (deps: DependencyTree[], level = 0) => {
    return deps.map((dep, index) => (
      <div key={index} className="ml-4">
        <div className="flex items-center gap-2 py-1">
          <div className="w-4 h-4 flex items-center justify-center">
            {level === 0 ? (
              <Package className="w-3 h-3 text-primary" />
            ) : (
              <div className="w-2 h-2 bg-muted-foreground rounded-full" />
            )}
          </div>
          <span className="text-sm font-medium">{dep.name}</span>
          <span className="text-xs text-muted-foreground">{dep.version}</span>
        </div>
        {dep.dependencies && dep.dependencies.length > 0 && (
          <div className="ml-4">
            {renderDependencyTree(dep.dependencies, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-medium">Packages</span>
            <span className="text-sm text-muted-foreground">
              ({packageManager})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['missing-dependencies'] })}
              className="p-1 hover:bg-accent rounded"
              disabled={missingLoading}
            >
              <RefreshCw className={`w-4 h-4 ${missingLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowInstallForm(true)}
              className="p-1 hover:bg-accent rounded"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Package Manager Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Package Manager</label>
          <select
            value={packageManager}
            onChange={(e) => setPackageManager(e.target.value)}
            className="w-full p-2 text-sm bg-background border border-border rounded"
          >
            <option value="npm">npm</option>
            <option value="pip">pip</option>
            <option value="cargo">cargo</option>
            <option value="go">go</option>
          </select>
        </div>

        {/* Install Package Form */}
        {showInstallForm && (
          <div className="mb-4 p-3 bg-accent rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Package name"
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleInstall()}
              />
              <button
                onClick={handleInstall}
                disabled={!newPackage.trim() || installMutation.isPending}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
              >
                {installMutation.isPending ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={() => setShowInstallForm(false)}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Missing Dependencies */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Missing Dependencies</h3>
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update All'}
            </button>
          </div>
          
          {missingLoading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          ) : missingDeps && missingDeps.length > 0 ? (
            <div className="space-y-2">
              {missingDeps.map((dep: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{dep}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">All dependencies are installed</span>
            </div>
          )}
        </div>

        {/* Dependency Tree */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">Dependency Tree</h3>
          {treeLoading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          ) : dependencyTree ? (
            <div className="space-y-1">
              {renderDependencyTree([dependencyTree])}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dependency tree available</p>
          )}
        </div>

        {/* Package Manager Info */}
        <div className="p-4 border-t border-border">
          <h3 className="font-medium mb-3">Package Manager Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Detected Manager:</span>
              <span className="text-muted-foreground">
                {detectedManager || 'None detected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current Manager:</span>
              <span className="text-muted-foreground">{packageManager}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}