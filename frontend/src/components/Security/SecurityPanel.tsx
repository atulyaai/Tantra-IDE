import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Vulnerability {
  id: string;
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  fixAvailable: boolean;
  fixVersion?: string;
}

export default function SecurityPanel() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch security vulnerabilities
  const { data: vulnerabilities, isLoading: vulnLoading } = useQuery({
    queryKey: ['security-vulnerabilities'],
    queryFn: () => api.get('/security/scan').then(res => res.data.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fix vulnerability mutation
  const fixMutation = useMutation({
    mutationFn: (data: { packageName: string; fixVersion?: string }) => 
      api.post('/security/fix', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-vulnerabilities'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'moderate': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityCount = (severity: string) => {
    if (!vulnerabilities) return 0;
    return vulnerabilities.filter((vuln: Vulnerability) => 
      selectedSeverity === 'all' ? true : vuln.severity === severity
    ).length;
  };

  const filteredVulnerabilities = vulnerabilities?.filter((vuln: Vulnerability) => 
    selectedSeverity === 'all' ? true : vuln.severity === selectedSeverity
  ) || [];

  const handleFixVulnerability = (vuln: Vulnerability) => {
    if (!vuln.fixAvailable) return;
    
    fixMutation.mutate({
      packageName: vuln.package,
      fixVersion: vuln.fixVersion,
    });
  };

  if (vulnLoading) {
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
            <Shield className="w-5 h-5" />
            <span className="font-medium">Security</span>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['security-vulnerabilities'] })}
            className="p-1 hover:bg-accent rounded"
            disabled={vulnLoading}
          >
            <RefreshCw className={`w-4 h-4 ${vulnLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Severity Filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedSeverity('all')}
            className={`px-3 py-1 rounded text-sm ${
              selectedSeverity === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            All ({vulnerabilities?.length || 0})
          </button>
          <button
            onClick={() => setSelectedSeverity('critical')}
            className={`px-3 py-1 rounded text-sm ${
              selectedSeverity === 'critical' 
                ? 'bg-red-600 text-white' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Critical ({getSeverityCount('critical')})
          </button>
          <button
            onClick={() => setSelectedSeverity('high')}
            className={`px-3 py-1 rounded text-sm ${
              selectedSeverity === 'high' 
                ? 'bg-orange-600 text-white' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            High ({getSeverityCount('high')})
          </button>
          <button
            onClick={() => setSelectedSeverity('moderate')}
            className={`px-3 py-1 rounded text-sm ${
              selectedSeverity === 'moderate' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Moderate ({getSeverityCount('moderate')})
          </button>
          <button
            onClick={() => setSelectedSeverity('low')}
            className={`px-3 py-1 rounded text-sm ${
              selectedSeverity === 'low' 
                ? 'bg-blue-600 text-white' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Low ({getSeverityCount('low')})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {filteredVulnerabilities.length > 0 ? (
          <div className="space-y-4 p-4">
            {filteredVulnerabilities.map((vuln: Vulnerability) => (
              <div
                key={vuln.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(vuln.severity)}
                    <span className={`font-medium ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {vuln.package}
                    </span>
                  </div>
                  {vuln.fixAvailable && (
                    <button
                      onClick={() => handleFixVulnerability(vuln)}
                      disabled={fixMutation.isPending}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      {fixMutation.isPending ? 'Fixing...' : 'Fix'}
                    </button>
                  )}
                </div>
                
                <h4 className="font-medium mb-2">{vuln.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {vuln.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>ID: {vuln.id}</span>
                  {vuln.fixVersion && (
                    <span>Fix available in: {vuln.fixVersion}</span>
                  )}
                  <span className={vuln.fixAvailable ? 'text-green-600' : 'text-red-600'}>
                    {vuln.fixAvailable ? 'Fix available' : 'No fix available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No vulnerabilities found</h3>
            <p className="text-muted-foreground">
              {selectedSeverity === 'all' 
                ? 'Your project appears to be secure!'
                : `No ${selectedSeverity} vulnerabilities found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {vulnerabilities && vulnerabilities.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {getSeverityCount('critical')}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {getSeverityCount('high')}
              </div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {getSeverityCount('moderate')}
              </div>
              <div className="text-xs text-muted-foreground">Moderate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {getSeverityCount('low')}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}