import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

function Terminal() {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Create xterm instance
        const xterm = new XTerm({
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            fontSize: 14,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            theme: {
                background: '#0d1117',
                foreground: '#c9d1d9',
                cursor: '#58a6ff',
                cursorAccent: '#0d1117',
                selectionBackground: '#264f78',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc',
            },
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);
        xterm.open(terminalRef.current);

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Fit terminal to container
        setTimeout(() => {
            try { fitAddon.fit(); } catch { }
        }, 100);

        // Connect WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname;
        const wsPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/terminal`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            xterm.writeln('\x1b[1;36m🚀 Connected to Kubernetes terminal\x1b[0m');
            xterm.writeln('\x1b[90m   Use kubectl commands to solve exam questions\x1b[0m');
            xterm.writeln('');

            // Send resize
            try {
                fitAddon.fit();
                ws.send(JSON.stringify({
                    type: 'resize',
                    cols: xterm.cols,
                    rows: xterm.rows,
                }));
            } catch { }
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'output') {
                    xterm.write(msg.data);
                } else if (msg.type === 'exit') {
                    xterm.writeln('\r\n\x1b[31mTerminal session ended.\x1b[0m');
                }
            } catch {
                // Raw data
                xterm.write(event.data);
            }
        };

        ws.onclose = () => {
            xterm.writeln('\r\n\x1b[33m⚠ Connection closed\x1b[0m');
        };

        ws.onerror = () => {
            xterm.writeln('\r\n\x1b[31m❌ WebSocket error — is the server running?\x1b[0m');
        };

        // Terminal input → WebSocket
        xterm.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input', data }));
            }
        });

        // Handle resize
        const handleResize = () => {
            try {
                fitAddon.fit();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'resize',
                        cols: xterm.cols,
                        rows: xterm.rows,
                    }));
                }
            } catch { }
        };

        window.addEventListener('resize', handleResize);

        // ResizeObserver for container changes
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(handleResize, 50);
        });
        resizeObserver.observe(terminalRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            ws.close();
            xterm.dispose();
        };
    }, []);

    return (
        <div className="terminal-wrapper">
            <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">kubectl terminal — bash</span>
            </div>
            <div className="terminal-container" ref={terminalRef}></div>
        </div>
    );
}

export default Terminal;
