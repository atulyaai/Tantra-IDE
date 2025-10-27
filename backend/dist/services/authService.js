import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
class AuthService {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.dataDir = path.join(process.cwd(), '.tantra', 'auth');
        this.config = {
            jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
            jwtExpiresIn: '1h',
            refreshTokenExpiresIn: '7d',
            bcryptRounds: 12,
            maxSessions: 5,
            sessionTimeout: 60,
        };
        this.initializeAuth();
    }
    async initializeAuth() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await this.loadUsers();
            await this.loadSessions();
            // Create default admin user if no users exist
            if (this.users.size === 0) {
                await this.createDefaultAdmin();
            }
        }
        catch (error) {
            console.error('[Auth] Initialization error:', error);
        }
    }
    async loadUsers() {
        try {
            const usersPath = path.join(this.dataDir, 'users.json');
            const usersData = await fs.readFile(usersPath, 'utf-8');
            const users = JSON.parse(usersData);
            this.users.clear();
            for (const user of users) {
                this.users.set(user.id, user);
            }
        }
        catch (error) {
            // Users file doesn't exist yet
        }
    }
    async saveUsers() {
        try {
            const usersPath = path.join(this.dataDir, 'users.json');
            const users = Array.from(this.users.values());
            await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        }
        catch (error) {
            console.error('[Auth] Failed to save users:', error);
        }
    }
    async loadSessions() {
        try {
            const sessionsPath = path.join(this.dataDir, 'sessions.json');
            const sessionsData = await fs.readFile(sessionsPath, 'utf-8');
            const sessions = JSON.parse(sessionsData);
            this.sessions.clear();
            for (const session of sessions) {
                if (session.isActive && new Date(session.expiresAt) > new Date()) {
                    this.sessions.set(session.id, session);
                }
            }
        }
        catch (error) {
            // Sessions file doesn't exist yet
        }
    }
    async saveSessions() {
        try {
            const sessionsPath = path.join(this.dataDir, 'sessions.json');
            const sessions = Array.from(this.sessions.values());
            await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2));
        }
        catch (error) {
            console.error('[Auth] Failed to save sessions:', error);
        }
    }
    async createDefaultAdmin() {
        const adminUser = {
            id: crypto.randomUUID(),
            username: 'admin',
            email: 'admin@tantra-ide.dev',
            passwordHash: await bcrypt.hash('admin123', this.config.bcryptRounds),
            role: 'admin',
            permissions: ['*'], // All permissions
            createdAt: new Date(),
            isActive: true,
            preferences: {
                theme: 'dark',
                fontSize: 14,
                tabSize: 2,
                autoSave: true,
                notifications: true,
                language: 'en',
            },
        };
        this.users.set(adminUser.id, adminUser);
        await this.saveUsers();
        console.log('[Auth] Default admin user created (username: admin, password: admin123)');
    }
    async register(username, email, password) {
        // Check if user already exists
        const existingUser = Array.from(this.users.values()).find(user => user.username === username || user.email === email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Validate password strength
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        const passwordHash = await bcrypt.hash(password, this.config.bcryptRounds);
        const user = {
            id: crypto.randomUUID(),
            username,
            email,
            passwordHash,
            role: 'user',
            permissions: ['read', 'write', 'execute'],
            createdAt: new Date(),
            isActive: true,
            preferences: {
                theme: 'dark',
                fontSize: 14,
                tabSize: 2,
                autoSave: true,
                notifications: true,
                language: 'en',
            },
        };
        this.users.set(user.id, user);
        await this.saveUsers();
        return user;
    }
    async login(username, password, ipAddress, userAgent) {
        const user = Array.from(this.users.values()).find(u => u.username === username || u.email === username);
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        // Clean up old sessions for this user
        await this.cleanupUserSessions(user.id);
        // Create new session
        const session = await this.createSession(user.id, ipAddress, userAgent);
        // Update last login
        user.lastLogin = new Date();
        await this.saveUsers();
        return { user, session };
    }
    async logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.isActive = false;
            this.sessions.delete(sessionId);
            await this.saveSessions();
        }
    }
    async logoutAll(userId) {
        const userSessions = Array.from(this.sessions.values()).filter(session => session.userId === userId);
        for (const session of userSessions) {
            session.isActive = false;
            this.sessions.delete(session.id);
        }
        await this.saveSessions();
    }
    async createSession(userId, ipAddress, userAgent) {
        const token = jwt.sign({ userId, type: 'access' }, this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn });
        const refreshToken = jwt.sign({ userId, type: 'refresh' }, this.config.jwtSecret, { expiresIn: this.config.refreshTokenExpiresIn });
        const session = {
            id: crypto.randomUUID(),
            userId,
            token,
            refreshToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            createdAt: new Date(),
            lastActivity: new Date(),
            ipAddress,
            userAgent,
            isActive: true,
        };
        this.sessions.set(session.id, session);
        await this.saveSessions();
        return session;
    }
    async cleanupUserSessions(userId) {
        const userSessions = Array.from(this.sessions.values()).filter(session => session.userId === userId);
        // Remove oldest sessions if exceeding max
        if (userSessions.length >= this.config.maxSessions) {
            const sortedSessions = userSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const sessionsToRemove = sortedSessions.slice(0, userSessions.length - this.config.maxSessions + 1);
            for (const session of sessionsToRemove) {
                session.isActive = false;
                this.sessions.delete(session.id);
            }
        }
    }
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            if (decoded.type !== 'access') {
                return null;
            }
            const session = Array.from(this.sessions.values()).find(s => s.token === token && s.isActive);
            if (!session || new Date(session.expiresAt) <= new Date()) {
                return null;
            }
            const user = this.users.get(session.userId);
            if (!user || !user.isActive) {
                return null;
            }
            // Update last activity
            session.lastActivity = new Date();
            await this.saveSessions();
            return { user, session };
        }
        catch (error) {
            return null;
        }
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, this.config.jwtSecret);
            if (decoded.type !== 'refresh') {
                return null;
            }
            const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken && s.isActive);
            if (!session || new Date(session.expiresAt) <= new Date()) {
                return null;
            }
            // Generate new access token
            const newToken = jwt.sign({ userId: session.userId, type: 'access' }, this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn });
            session.token = newToken;
            session.lastActivity = new Date();
            await this.saveSessions();
            return { token: newToken, session };
        }
        catch (error) {
            return null;
        }
    }
    async updateUserPreferences(userId, preferences) {
        const user = this.users.get(userId);
        if (user) {
            user.preferences = { ...user.preferences, ...preferences };
            await this.saveUsers();
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long');
        }
        user.passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);
        await this.saveUsers();
    }
    async getUser(userId) {
        return this.users.get(userId) || null;
    }
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    async getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.isActive);
    }
    async hasPermission(userId, permission) {
        const user = this.users.get(userId);
        if (!user || !user.isActive) {
            return false;
        }
        return user.permissions.includes('*') || user.permissions.includes(permission);
    }
    async cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = Array.from(this.sessions.values()).filter(session => new Date(session.expiresAt) <= now);
        for (const session of expiredSessions) {
            session.isActive = false;
            this.sessions.delete(session.id);
        }
        if (expiredSessions.length > 0) {
            await this.saveSessions();
        }
    }
}
export const authService = new AuthService();
//# sourceMappingURL=authService.js.map