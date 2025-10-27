export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'user' | 'guest';
    permissions: string[];
    createdAt: Date;
    lastLogin?: Date;
    isActive: boolean;
    preferences: UserPreferences;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    tabSize: number;
    autoSave: boolean;
    notifications: boolean;
    language: string;
}
export interface AuthSession {
    id: string;
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
}
export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
    maxSessions: number;
    sessionTimeout: number;
}
declare class AuthService {
    private users;
    private sessions;
    private config;
    private dataDir;
    constructor();
    private initializeAuth;
    private loadUsers;
    private saveUsers;
    private loadSessions;
    private saveSessions;
    private createDefaultAdmin;
    register(username: string, email: string, password: string): Promise<User>;
    login(username: string, password: string, ipAddress: string, userAgent: string): Promise<{
        user: User;
        session: AuthSession;
    }>;
    logout(sessionId: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    private createSession;
    private cleanupUserSessions;
    validateToken(token: string): Promise<{
        user: User;
        session: AuthSession;
    } | null>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        session: AuthSession;
    } | null>;
    updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getUser(userId: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    getActiveSessions(): Promise<AuthSession[]>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    cleanupExpiredSessions(): Promise<void>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map