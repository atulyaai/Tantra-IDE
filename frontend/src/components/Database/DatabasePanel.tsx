import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '../../services/api';
import { 
  Database, 
  Play, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Table,
  Settings
} from 'lucide-react';

export default function DatabasePanel() {
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('query');

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['database-connections'],
    queryFn: () => databaseAPI.getConnections(),
  });

  const { data: schema, isLoading: schemaLoading } = useQuery({
    queryKey: ['database-schema', selectedConnection?.id],
    queryFn: () => databaseAPI.getSchema(selectedConnection),
    enabled: !!selectedConnection,
  });

  const handleExecuteQuery = async () => {
    if (!selectedConnection || !query.trim()) return;

    setIsExecuting(true);
    try {
      const result = await databaseAPI.executeQuery(selectedConnection, query);
      setQueryResult(result);
    } catch (error) {
      console.error('Query execution error:', error);
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestConnection = async (connection: any) => {
    try {
      const isConnected = await databaseAPI.testConnection(connection);
      if (isConnected) {
        setSelectedConnection(connection);
      }
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'mysql':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'postgresql':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'sqlite':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'mongodb':
        return <Database className="w-4 h-4 text-green-600" />;
      case 'redis':
        return <Database className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'query', label: 'Query', icon: Play },
    { id: 'schema', label: 'Schema', icon: Table },
    { id: 'builder', label: 'Builder', icon: Edit },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Database Browser</h2>
        </div>

        {/* Connection Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Database Connections</label>
          {connectionsLoading ? (
            <div className="text-center text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Detecting database connections...
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedConnection?.id === connection.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedConnection(connection)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getConnectionIcon(connection.type)}
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {connection.type} • {connection.host || 'Local'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConnectionStatusIcon(connection.status)}
                      <button
                        className="p-1 hover:bg-accent rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(connection);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No database connections detected</p>
              <p className="text-xs">Check your .env files and database configuration</p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
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
      <div className="flex-1 overflow-hidden">
        {!selectedConnection ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a database connection to get started</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Query Tab */}
            {activeTab === 'query' && (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex-1 flex flex-col gap-4">
                  {/* Query Input */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium mb-2">SQL Query</label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded bg-background font-mono text-sm"
                      placeholder="SELECT * FROM users WHERE id = 1;"
                    />
                  </div>

                  {/* Execute Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleExecuteQuery}
                      disabled={!query.trim() || isExecuting}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Execute Query
                        </>
                      )}
                    </button>
                  </div>

                  {/* Query Results */}
                  {queryResult && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Query Results</h3>
                        <div className="text-sm text-muted-foreground">
                          {queryResult.rowCount} rows • {queryResult.executionTime}ms
                        </div>
                      </div>
                      
                      {queryResult.error ? (
                        <div className="flex-1 bg-red-50 border border-red-200 rounded p-4">
                          <div className="text-red-600 font-medium">Error:</div>
                          <div className="text-red-700">{queryResult.error}</div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-auto border border-border rounded">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                {queryResult.columns.map((column: string, index: number) => (
                                  <th key={index} className="px-3 py-2 text-left text-sm font-medium">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResult.rows.map((row: any[], rowIndex: number) => (
                                <tr key={rowIndex} className="border-t border-border">
                                  {row.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="px-3 py-2 text-sm">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schema Tab */}
            {activeTab === 'schema' && (
              <div className="flex-1 overflow-y-auto p-4">
                {schemaLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Loading database schema...
                  </div>
                ) : schema && schema.tables.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Database Tables</h3>
                    {schema.tables.map((table: any, index: number) => (
                      <div key={index} className="bg-card border border-border rounded p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Table className="w-4 h-4" />
                            <span className="font-medium">{table.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {table.rowCount} rows
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {table.columns.map((column: any, colIndex: number) => (
                            <div key={colIndex} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{column.name}</span>
                                <span className="text-muted-foreground">{column.type}</span>
                                {column.primaryKey && (
                                  <span className="bg-primary text-primary-foreground px-1 py-0.5 rounded text-xs">
                                    PK
                                  </span>
                                )}
                                {!column.nullable && (
                                  <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs">
                                    NOT NULL
                                  </span>
                                )}
                              </div>
                              {column.defaultValue && (
                                <span className="text-muted-foreground text-xs">
                                  Default: {column.defaultValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tables found in this database</p>
                  </div>
                )}
              </div>
            )}

            {/* Query Builder Tab */}
            {activeTab === 'builder' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-center text-muted-foreground py-8">
                  <Edit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Query Builder coming soon</p>
                  <p className="text-xs">Visual query building interface</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
