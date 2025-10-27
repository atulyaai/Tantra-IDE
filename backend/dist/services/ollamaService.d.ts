import type { Socket, Server as SocketIOServer } from 'socket.io';
export declare function setupOllamaHandlers(socket: Socket, io: SocketIOServer): void;
export declare function checkOllamaConnection(): Promise<boolean>;
export declare function listModels(): Promise<any[]>;
//# sourceMappingURL=ollamaService.d.ts.map