import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();

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

// Detect database connections from project files
export async function detectDatabaseConnections(): Promise<DatabaseConnection[]> {
  const connections: DatabaseConnection[] = [];
  
  try {
    // Check for common database configuration files
    const configFiles = [
      '.env',
      '.env.local',
      '.env.development',
      'config/database.js',
      'config/database.json',
      'prisma/schema.prisma',
      'knexfile.js',
      'ormconfig.js',
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(WORKSPACE_PATH, configFile);
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const detectedConnections = parseDatabaseConfig(content, configFile);
        connections.push(...detectedConnections);
      } catch {
        // File doesn't exist, continue
      }
    }
    
    // Check package.json for database dependencies
    try {
      const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const dbDependencies = detectDatabaseDependencies(packageJson);
      connections.push(...dbDependencies);
    } catch {
      // No package.json or error reading it
    }
    
    return connections;
  } catch (error) {
    console.error('Error detecting database connections:', error);
    return [];
  }
}

function parseDatabaseConfig(content: string, filename: string): DatabaseConnection[] {
  const connections: DatabaseConnection[] = [];
  
  if (filename.includes('.env')) {
    // Parse .env files
    const lines = content.split('\n');
    const dbVars: Record<string, string> = {};
    
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value && key.toLowerCase().includes('db')) {
        dbVars[key.trim()] = value.trim();
      }
    }
    
    if (dbVars.DATABASE_URL || dbVars.DB_URL) {
      const url = dbVars.DATABASE_URL || dbVars.DB_URL;
      const connection = parseConnectionString(url);
      if (connection) {
        connections.push({
          id: `env-${Date.now()}`,
          name: 'Environment Database',
          ...connection,
          type: connection.type || 'sqlite',
          status: 'disconnected',
        });
      }
    }
  } else if (filename.includes('prisma')) {
    // Parse Prisma schema
    const urlMatch = content.match(/url\s*=\s*["']([^"']+)["']/);
    if (urlMatch) {
      const connection = parseConnectionString(urlMatch[1]);
      if (connection) {
        connections.push({
          id: `prisma-${Date.now()}`,
          name: 'Prisma Database',
          ...connection,
          type: connection.type || 'sqlite',
          status: 'disconnected',
        });
      }
    }
  }
  
  return connections;
}

function parseConnectionString(url: string): Partial<DatabaseConnection> | null {
  try {
    const urlObj = new URL(url);
    const type = urlObj.protocol.replace(':', '') as DatabaseConnection['type'];
    
    return {
      type,
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || undefined,
      database: urlObj.pathname.slice(1),
      username: urlObj.username || undefined,
      password: urlObj.password || undefined,
      connectionString: url,
    };
  } catch {
    return null;
  }
}

function detectDatabaseDependencies(packageJson: any): DatabaseConnection[] {
  const connections: DatabaseConnection[] = [];
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const dbPackages = {
    'mysql2': 'mysql',
    'pg': 'postgresql',
    'sqlite3': 'sqlite',
    'mongodb': 'mongodb',
    'redis': 'redis',
    'prisma': 'postgresql', // Default for Prisma
  };
  
  for (const [packageName, dbType] of Object.entries(dbPackages)) {
    if (dependencies[packageName]) {
      connections.push({
        id: `package-${packageName}`,
        name: `${packageName} Database`,
        type: dbType as DatabaseConnection['type'],
        status: 'disconnected',
      });
    }
  }
  
  return connections;
}

// Test database connection
export async function testConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    switch (connection.type) {
      case 'mysql':
        return await testMySQLConnection(connection);
      case 'postgresql':
        return await testPostgreSQLConnection(connection);
      case 'sqlite':
        return await testSQLiteConnection(connection);
      case 'mongodb':
        return await testMongoDBConnection(connection);
      case 'redis':
        return await testRedisConnection(connection);
      default:
        return false;
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
}

async function testMySQLConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    const command = `mysql -h ${connection.host} -P ${connection.port} -u ${connection.username} -p${connection.password} -e "SELECT 1"`;
    await execAsync(command, { cwd: WORKSPACE_PATH });
    return true;
  } catch {
    return false;
  }
}

async function testPostgreSQLConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    const command = `psql -h ${connection.host} -p ${connection.port} -U ${connection.username} -d ${connection.database} -c "SELECT 1"`;
    await execAsync(command, { cwd: WORKSPACE_PATH });
    return true;
  } catch {
    return false;
  }
}

async function testSQLiteConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    const dbPath = connection.database || connection.connectionString;
    if (!dbPath) return false;
    
    const command = `sqlite3 "${dbPath}" "SELECT 1"`;
    await execAsync(command, { cwd: WORKSPACE_PATH });
    return true;
  } catch {
    return false;
  }
}

async function testMongoDBConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    const command = `mongosh --host ${connection.host}:${connection.port} --eval "db.runCommand({ping: 1})"`;
    await execAsync(command, { cwd: WORKSPACE_PATH });
    return true;
  } catch {
    return false;
  }
}

async function testRedisConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    const command = `redis-cli -h ${connection.host} -p ${connection.port} ping`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    return stdout.trim() === 'PONG';
  } catch {
    return false;
  }
}

// Execute database queries
export async function executeQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    switch (connection.type) {
      case 'mysql':
        return await executeMySQLQuery(connection, query);
      case 'postgresql':
        return await executePostgreSQLQuery(connection, query);
      case 'sqlite':
        return await executeSQLiteQuery(connection, query);
      case 'mongodb':
        return await executeMongoDBQuery(connection, query);
      case 'redis':
        return await executeRedisQuery(connection, query);
      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  } catch (error: any) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function executeMySQLQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    const command = `mysql -h ${connection.host} -P ${connection.port} -u ${connection.username} -p${connection.password} -D ${connection.database} -e "${query}"`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    
    const lines = stdout.trim().split('\n');
    const columns = lines[0]?.split('\t') || [];
    const rows = lines.slice(1).map(line => line.split('\t'));
    
    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`MySQL query error: ${error.message}`);
  }
}

async function executePostgreSQLQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    const command = `psql -h ${connection.host} -p ${connection.port} -U ${connection.username} -d ${connection.database} -c "${query}"`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    
    // Parse PostgreSQL output (simplified)
    const lines = stdout.trim().split('\n');
    const columns = lines[0]?.split('|').map(col => col.trim()) || [];
    const rows = lines.slice(2, -2).map(line => 
      line.split('|').map(cell => cell.trim())
    );
    
    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`PostgreSQL query error: ${error.message}`);
  }
}

async function executeSQLiteQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    const dbPath = connection.database || connection.connectionString;
    if (!dbPath) throw new Error('No database path provided');
    
    const command = `sqlite3 "${dbPath}" "${query}"`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    
    const lines = stdout.trim().split('\n');
    const rows = lines.map(line => line.split('|'));
    
    // For SQLite, we need to get column names separately
    const columnQuery = `PRAGMA table_info(${extractTableName(query)})`;
    const { stdout: columnOutput } = await execAsync(`sqlite3 "${dbPath}" "${columnQuery}"`, { cwd: WORKSPACE_PATH });
    const columns = columnOutput.trim().split('\n').map(line => line.split('|')[1]);
    
    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`SQLite query error: ${error.message}`);
  }
}

async function executeMongoDBQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    // MongoDB queries are more complex, this is a simplified version
    const command = `mongosh --host ${connection.host}:${connection.port} --eval "${query}"`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    
    return {
      columns: ['result'],
      rows: [[stdout.trim()]],
      rowCount: 1,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`MongoDB query error: ${error.message}`);
  }
}

async function executeRedisQuery(connection: DatabaseConnection, query: string): Promise<QueryResult> {
  const startTime = Date.now();
  
  try {
    const command = `redis-cli -h ${connection.host} -p ${connection.port} ${query}`;
    const { stdout } = await execAsync(command, { cwd: WORKSPACE_PATH });
    
    return {
      columns: ['result'],
      rows: [[stdout.trim()]],
      rowCount: 1,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    throw new Error(`Redis query error: ${error.message}`);
  }
}

function extractTableName(query: string): string {
  const match = query.match(/FROM\s+(\w+)/i);
  return match ? match[1] : 'unknown';
}

// Get database schema
export async function getDatabaseSchema(connection: DatabaseConnection): Promise<DatabaseSchema> {
  try {
    switch (connection.type) {
      case 'mysql':
        return await getMySQLSchema(connection);
      case 'postgresql':
        return await getPostgreSQLSchema(connection);
      case 'sqlite':
        return await getSQLiteSchema(connection);
      case 'mongodb':
        return await getMongoDBSchema(connection);
      default:
        return { tables: [], views: [], indexes: [], functions: [] };
    }
  } catch (error) {
    console.error('Schema retrieval error:', error);
    return { tables: [], views: [], indexes: [], functions: [] };
  }
}

async function getMySQLSchema(connection: DatabaseConnection): Promise<DatabaseSchema> {
  const tablesQuery = `SHOW TABLES`;
  const result = await executeMySQLQuery(connection, tablesQuery);
  
  const tables: DatabaseTable[] = [];
  
  for (const row of result.rows) {
    const tableName = row[0];
    const columnsQuery = `DESCRIBE ${tableName}`;
    const columnsResult = await executeMySQLQuery(connection, columnsQuery);
    
    const columns: DatabaseColumn[] = columnsResult.rows.map((col: any[]) => ({
      name: col[0],
      type: col[1],
      nullable: col[2] === 'YES',
      primaryKey: col[3] === 'PRI',
      defaultValue: col[4],
    }));
    
    tables.push({
      name: tableName,
      columns,
      rowCount: 0, // Would need separate query
      size: 0, // Would need separate query
    });
  }
  
  return { tables, views: [], indexes: [], functions: [] };
}

async function getPostgreSQLSchema(connection: DatabaseConnection): Promise<DatabaseSchema> {
  const tablesQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const result = await executePostgreSQLQuery(connection, tablesQuery);
  
  const tables: DatabaseTable[] = [];
  
  for (const row of result.rows) {
    const tableName = row[0];
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
    `;
    const columnsResult = await executePostgreSQLQuery(connection, columnsQuery);
    
    const columns: DatabaseColumn[] = columnsResult.rows.map((col: any[]) => ({
      name: col[0],
      type: col[1],
      nullable: col[2] === 'YES',
      primaryKey: false, // Would need separate query
      defaultValue: col[3],
    }));
    
    tables.push({
      name: tableName,
      columns,
      rowCount: 0,
      size: 0,
    });
  }
  
  return { tables, views: [], indexes: [], functions: [] };
}

async function getSQLiteSchema(connection: DatabaseConnection): Promise<DatabaseSchema> {
  const tablesQuery = `SELECT name FROM sqlite_master WHERE type='table'`;
  const result = await executeSQLiteQuery(connection, tablesQuery);
  
  const tables: DatabaseTable[] = [];
  
  for (const row of result.rows) {
    const tableName = row[0];
    const columnsQuery = `PRAGMA table_info(${tableName})`;
    const columnsResult = await executeSQLiteQuery(connection, columnsQuery);
    
    const columns: DatabaseColumn[] = columnsResult.rows.map((col: any[]) => ({
      name: col[1],
      type: col[2],
      nullable: col[3] === 0,
      primaryKey: col[5] === 1,
      defaultValue: col[4],
    }));
    
    tables.push({
      name: tableName,
      columns,
      rowCount: 0,
      size: 0,
    });
  }
  
  return { tables, views: [], indexes: [], functions: [] };
}

async function getMongoDBSchema(connection: DatabaseConnection): Promise<DatabaseSchema> {
  // MongoDB doesn't have a traditional schema, return collections as tables
  const collectionsQuery = `db.runCommand("listCollections")`;
  const result = await executeMongoDBQuery(connection, collectionsQuery);
  
  const tables: DatabaseTable[] = [];
  
  // This is a simplified version - MongoDB schema analysis is more complex
  tables.push({
    name: 'collections',
    columns: [
      { name: 'name', type: 'string', nullable: false, primaryKey: true },
      { name: 'type', type: 'string', nullable: true, primaryKey: false },
    ],
    rowCount: 0,
    size: 0,
  });
  
  return { tables, views: [], indexes: [], functions: [] };
}

// Query builder helpers
export function buildSelectQuery(table: string, columns: string[] = ['*'], where?: Record<string, any>): string {
  let query = `SELECT ${columns.join(', ')} FROM ${table}`;
  
  if (where && Object.keys(where).length > 0) {
    const conditions = Object.entries(where).map(([key, value]) => 
      `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
    );
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  return query;
}

export function buildInsertQuery(table: string, data: Record<string, any>): string {
  const columns = Object.keys(data);
  const values = Object.values(data).map(value => 
    typeof value === 'string' ? `'${value}'` : value
  );
  
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
}

export function buildUpdateQuery(table: string, data: Record<string, any>, where: Record<string, any>): string {
  const sets = Object.entries(data).map(([key, value]) => 
    `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
  );
  
  const conditions = Object.entries(where).map(([key, value]) => 
    `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
  );
  
  return `UPDATE ${table} SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')}`;
}

export function buildDeleteQuery(table: string, where: Record<string, any>): string {
  const conditions = Object.entries(where).map(([key, value]) => 
    `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
  );
  
  return `DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`;
}

