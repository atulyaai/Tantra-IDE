import * as pty from 'node-pty';
import type { Socket } from 'socket.io';
import os from 'os';

const terminals = new Map<string, pty.IPty>();

export function setupTerminalHandlers(socket: Socket) {
  socket.on('terminal:create', () => {
    try {
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.WORKSPACE_PATH || process.cwd(),
        env: process.env as any,
      });

      terminals.set(socket.id, term);

      term.onData((data) => {
        socket.emit('terminal:output', { data });
      });

      term.onExit(() => {
        terminals.delete(socket.id);
        socket.emit('terminal:exit');
      });

      socket.emit('terminal:ready');
    } catch (error: any) {
      console.error('[Terminal] Error creating terminal:', error);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  socket.on('terminal:input', (data: { data: string }) => {
    try {
      const term = terminals.get(socket.id);
      if (term) {
        term.write(data.data);
      } else {
        socket.emit('terminal:error', { error: 'Terminal not found' });
      }
    } catch (error: any) {
      console.error('[Terminal] Error handling input:', error);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  socket.on('terminal:resize', (data: { cols: number; rows: number }) => {
    try {
      const term = terminals.get(socket.id);
      if (term) {
        term.resize(data.cols, data.rows);
      } else {
        socket.emit('terminal:error', { error: 'Terminal not found' });
      }
    } catch (error: any) {
      console.error('[Terminal] Error resizing terminal:', error);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    const term = terminals.get(socket.id);
    if (term) {
      term.kill();
      terminals.delete(socket.id);
    }
  });
}

