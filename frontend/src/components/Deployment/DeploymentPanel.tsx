import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deploymentAPI } from '../../services/api';
import { 
  Rocket, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Download,
  Play,
  History
} from 'lucide-react';

export default function DeploymentPanel() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [deploymentConfig, setDeploymentConfig] = useState({
    projectName: '',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: {} as Record<string, string>,
    customDomain: '',
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);

  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ['deployment-platforms'],
    queryFn: () => deploymentAPI.getPlatforms(),
  });

  const { data: autoConfig } = useQuery({
    queryKey: ['deployment-config'],
    queryFn: () => deploymentAPI.getConfig(),
  });

  const { data: history } = useQuery({
    queryKey: ['deployment-history'],
    queryFn: () => deploymentAPI.getHistory(),
  });

  useEffect(() => {
    if (autoConfig) {
      setDeploymentConfig(prev => ({
        ...prev,
        ...autoConfig,
      }));
      setSelectedPlatform(autoConfig.platform || '');
    }
  }, [autoConfig]);

  const handleDeploy = async () => {
    if (!selectedPlatform) return;

    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const result = await deploymentAPI.deploy(selectedPlatform, deploymentConfig);
      setDeploymentResult(result);
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentResult({
        status: 'failed',
        logs: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleInstallCLI = async (platform: string) => {
    try {
      await deploymentAPI.installCLI(platform);
      // Refresh platforms list
      window.location.reload();
    } catch (error) {
      console.error('Failed to install CLI:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'building':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'building':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Deployment</h2>
        </div>

        {/* Platform Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deployment Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {platformsLoading ? (
                <div className="col-span-2 text-center text-muted-foreground">Loading platforms...</div>
              ) : (
                platforms?.map((platform) => (
                  <div
                    key={platform.name}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedPlatform === platform.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlatform(platform.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{platform.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {platform.installed ? 'Ready' : 'Not installed'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platform.installed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <button
                            className="p-1 hover:bg-accent rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstallCLI(platform.name);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configuration */}
          {selectedPlatform && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  value={deploymentConfig.projectName}
                  onChange={(e) => setDeploymentConfig(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                  placeholder="my-project"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Build Command</label>
                  <input
                    type="text"
                    value={deploymentConfig.buildCommand}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, buildCommand: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-background"
                    placeholder="npm run build"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Output Directory</label>
                  <input
                    type="text"
                    value={deploymentConfig.outputDirectory}
                    onChange={(e) => setDeploymentConfig(prev => ({ ...prev, outputDirectory: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-background"
                    placeholder="dist"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={deploymentConfig.customDomain}
                  onChange={(e) => setDeploymentConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                  placeholder="myapp.com"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Deployment Actions */}
        <div className="w-1/2 p-4 border-r border-border">
          <div className="space-y-4">
            <button
              onClick={handleDeploy}
              disabled={!selectedPlatform || isDeploying}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeploying ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Deploy Now
                </>
              )}
            </button>

            {/* Deployment Result */}
            {deploymentResult && (
              <div className="bg-card border border-border rounded p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(deploymentResult.status)}
                  <span className={`font-medium ${getStatusColor(deploymentResult.status)}`}>
                    {deploymentResult.status.charAt(0).toUpperCase() + deploymentResult.status.slice(1)}
                  </span>
                </div>

                {deploymentResult.url && (
                  <div className="mb-3">
                    <a
                      href={deploymentResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {deploymentResult.url}
                    </a>
                  </div>
                )}

                {deploymentResult.logs && deploymentResult.logs.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Deployment Logs:</div>
                    <div className="bg-muted p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                      {deploymentResult.logs.map((log: string, index: number) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deployment History */}
        <div className="w-1/2 p-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4" />
            <h3 className="font-semibold">Deployment History</h3>
          </div>

          {history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((deployment: any) => (
                <div key={deployment.id} className="bg-card border border-border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deployment.status)}
                      <span className="font-medium">{deployment.id}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(deployment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {deployment.url && (
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Site
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No deployments yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
