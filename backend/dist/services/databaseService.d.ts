export interface DatabaseConnection {
    id: string;
    name: string;
    type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    connectionString?: string;
    status: 'connected' | 'disconnected' | 'error';
}
export interface DatabaseTable {
    name: string;
    columns: DatabaseColumn[];
    rowCount: number;
    size: number;
}
export interface DatabaseColumn {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    defaultValue?: any;
    foreignKey?: {
        table: string;
        column: string;
    };
}
export interface QueryResult {
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTime: number;
    error?: string;
}
export interface DatabaseSchema {
    tables: DatabaseTable[];
    views: any[];
    indexes: any[];
    functions: any[];
}
export declare function detectDatabaseConnections(): Promise<DatabaseConnection[]>;
export declare function testConnection(connection: DatabaseConnection): Promise<boolean>;
export declare function executeQuery(connection: DatabaseConnection, query: string): Promise<QueryResult>;
export declare function getDatabaseSchema(connection: DatabaseConnection): Promise<DatabaseSchema>;
export declare function buildSelectQuery(table: string, columns?: string[], where?: Record<string, any>): string;
export declare function buildInsertQuery(table: string, data: Record<string, any>): string;
export declare function buildUpdateQuery(table: string, data: Record<string, any>, where: Record<string, any>): string;
export declare function buildDeleteQuery(table: string, where: Record<string, any>): string;
//# sourceMappingURL=databaseService.d.ts.map