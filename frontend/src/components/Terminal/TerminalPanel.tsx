import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export default function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to backend WebSocket
    const socket = io(WS_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Terminal] Connected to WebSocket');
      socket.emit('terminal:create');
    });

    socket.on('terminal:output', (data: { data: string }) => {
      term.write(data.data);
    });

    socket.on('terminal:ready', () => {
      term.write('Welcome to Tantra IDE Terminal\r\n\r\n');
    });

    // Send input to backend
    term.onData((data) => {
      socket.emit('terminal:input', { data });
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal:resize', {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}

