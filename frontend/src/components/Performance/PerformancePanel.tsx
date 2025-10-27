import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { performanceAPI } from '../../services/api';
import { 
  Zap, 
  BarChart3, 
  HardDrive, 
  Network, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Download,
  Activity
} from 'lucide-react';

export default function PerformancePanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: performanceReport, isLoading, refetch } = useQuery({
    queryKey: ['performance-report'],
    queryFn: () => performanceAPI.getPerformanceReport(),
    enabled: false, // Only run when manually triggered
  });

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await refetch();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bundle', label: 'Bundle', icon: Download },
    { id: 'lighthouse', label: 'Lighthouse', icon: Zap },
    { id: 'memory', label: 'Memory', icon: HardDrive },
    { id: 'network', label: 'Network', icon: Network },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Performance Analysis</h2>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!performanceReport && !isAnalyzing ? (
          <div className="text-center text-muted-foreground py-8">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Analysis" to start performance profiling</p>
          </div>
        ) : isLoading || isAnalyzing ? (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 animate-spin" />
            <p>Running performance analysis...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Lighthouse Scores */}
                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Lighthouse Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {getScoreIcon(performanceReport.lighthouse.performance)}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceReport.lighthouse.performance)}`}>
                        {performanceReport.lighthouse.performance}
                      </div>
                      <div className="text-sm text-muted-foreground">Performance</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {getScoreIcon(performanceReport.lighthouse.accessibility)}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceReport.lighthouse.accessibility)}`}>
                        {performanceReport.lighthouse.accessibility}
                      </div>
                      <div className="text-sm text-muted-foreground">Accessibility</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {getScoreIcon(performanceReport.lighthouse.bestPractices)}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceReport.lighthouse.bestPractices)}`}>
                        {performanceReport.lighthouse.bestPractices}
                      </div>
                      <div className="text-sm text-muted-foreground">Best Practices</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {getScoreIcon(performanceReport.lighthouse.seo)}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(performanceReport.lighthouse.seo)}`}>
                        {performanceReport.lighthouse.seo}
                      </div>
                      <div className="text-sm text-muted-foreground">SEO</div>
                    </div>
                  </div>
                </div>

                {/* Bundle Summary */}
                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Bundle Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatBytes(performanceReport.bundle.totalSize)}</div>
                      <div className="text-sm text-muted-foreground">Total Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatBytes(performanceReport.bundle.gzippedSize)}</div>
                      <div className="text-sm text-muted-foreground">Gzipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{performanceReport.bundle.files.length}</div>
                      <div className="text-sm text-muted-foreground">Files</div>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Optimization Suggestions</h3>
                  <div className="space-y-2">
                    {performanceReport.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Tab */}
            {activeTab === 'bundle' && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Bundle Files</h3>
                  <div className="space-y-2">
                    {performanceReport.bundle.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">{file.path}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatBytes(file.size)}</div>
                          <div className="text-sm text-muted-foreground">Gzipped: {formatBytes(file.gzippedSize)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Duplicate Modules</h3>
                  <div className="space-y-2">
                    {performanceReport.bundle.duplicates.map((duplicate: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{duplicate.name}</div>
                          <div className="text-sm text-muted-foreground">{duplicate.instances} instances</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatBytes(duplicate.totalSize)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lighthouse Tab */}
            {activeTab === 'lighthouse' && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Core Web Vitals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatTime(performanceReport.lighthouse.metrics.firstContentfulPaint)}</div>
                      <div className="text-sm text-muted-foreground">First Contentful Paint</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatTime(performanceReport.lighthouse.metrics.largestContentfulPaint)}</div>
                      <div className="text-sm text-muted-foreground">Largest Contentful Paint</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatTime(performanceReport.lighthouse.metrics.firstInputDelay)}</div>
                      <div className="text-sm text-muted-foreground">First Input Delay</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{performanceReport.lighthouse.metrics.cumulativeLayoutShift.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Cumulative Layout Shift</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded p-4">
                  <h3 className="font-semibold mb-4">Optimization Opportunities</h3>
                  <div className="space-y-2">
                    {performanceReport.lighthouse.opportunities.map((opportunity: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded">
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{opportunity.description}</div>
                        <div className="text-sm">
                          Potential savings: {opportunity.savings.bytes ? formatBytes(opportunity.savings.bytes) : ''} 
                          {opportunity.savings.ms ? ` ${formatTime(opportunity.savings.ms)}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && performanceReport.memory && (
              <div className="bg-card border border-border rounded p-4">
                <h3 className="font-semibold mb-4">Memory Usage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(performanceReport.memory.heapUsed)}</div>
                    <div className="text-sm text-muted-foreground">Heap Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(performanceReport.memory.heapTotal)}</div>
                    <div className="text-sm text-muted-foreground">Heap Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(performanceReport.memory.rss)}</div>
                    <div className="text-sm text-muted-foreground">RSS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(performanceReport.memory.external)}</div>
                    <div className="text-sm text-muted-foreground">External</div>
                  </div>
                </div>
              </div>
            )}

            {/* Network Tab */}
            {activeTab === 'network' && (
              <div className="bg-card border border-border rounded p-4">
                <h3 className="font-semibold mb-4">Network Analysis</h3>
                <div className="text-center text-muted-foreground py-8">
                  <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Network analysis requires a running application</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
