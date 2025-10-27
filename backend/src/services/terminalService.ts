import { spawn, ChildProcess } from 'child_process';
import type { Socket } from 'socket.io';
import os from 'os';

const terminals = new Map<string, ChildProcess>();

export function setupTerminalHandlers(socket: Socket) {
  socket.on('terminal:create', () => {
    try {
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      
      const term = spawn(shell, [], {
        cwd: process.env.WORKSPACE_PATH || process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      terminals.set(socket.id, term);

      term.stdout?.on('data', (data) => {
        socket.emit('terminal:output', { data: data.toString() });
      });

      term.stderr?.on('data', (data) => {
        socket.emit('terminal:output', { data: data.toString() });
      });

      term.on('exit', () => {
        terminals.delete(socket.id);
        socket.emit('terminal:exit');
      });

      term.on('error', (error) => {
        console.error('[Terminal] Error:', error);
        socket.emit('terminal:error', { error: error.message });
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
      if (term && term.stdin) {
        term.stdin.write(data.data);
      } else {
        socket.emit('terminal:error', { error: 'Terminal not found' });
      }
    } catch (error: any) {
      console.error('[Terminal] Error handling input:', error);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  socket.on('terminal:resize', (data: { cols: number; rows: number }) => {
    // Note: Basic spawn doesn't support resize, but we'll keep the interface
    socket.emit('terminal:output', { data: `\x1b[8;${data.rows};${data.cols}t` });
  });

  socket.on('disconnect', () => {
    const term = terminals.get(socket.id);
    if (term) {
      term.kill();
      terminals.delete(socket.id);
    }
  });
}

