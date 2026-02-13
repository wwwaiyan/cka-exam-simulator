const os = require('os');

/**
 * Sets up a terminal session over WebSocket using node-pty.
 * Each connection gets its own bash shell with kubectl access.
 */
function setupTerminal(ws) {
    let pty;

    try {
        // node-pty is a native module — require at runtime
        const nodePty = require('node-pty');

        const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';
        const homeDir = os.homedir();

        pty = nodePty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: 120,
            rows: 30,
            cwd: homeDir,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                // Ensure kubectl uses the kind cluster
                KUBECONFIG: process.env.KUBECONFIG || `${homeDir}/.kube/config`,
            },
        });

        console.log(`[Terminal] New session started (PID: ${pty.pid})`);

        // PTY → WebSocket (terminal output to browser)
        pty.onData((data) => {
            try {
                if (ws.readyState === 1) { // WebSocket.OPEN
                    ws.send(JSON.stringify({ type: 'output', data }));
                }
            } catch (err) {
                // Client disconnected
            }
        });

        pty.onExit(({ exitCode }) => {
            console.log(`[Terminal] Session exited (code: ${exitCode})`);
            try {
                ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
                ws.close();
            } catch (err) {
                // Already closed
            }
        });

        // WebSocket → PTY (browser input to terminal)
        ws.on('message', (message) => {
            try {
                const msg = JSON.parse(message.toString());

                switch (msg.type) {
                    case 'input':
                        pty.write(msg.data);
                        break;

                    case 'resize':
                        if (msg.cols && msg.rows) {
                            pty.resize(Math.max(msg.cols, 10), Math.max(msg.rows, 5));
                        }
                        break;

                    default:
                        break;
                }
            } catch (err) {
                // If message isn't JSON, treat as raw input
                pty.write(message.toString());
            }
        });

        ws.on('close', () => {
            console.log(`[Terminal] WebSocket closed, killing PTY (PID: ${pty.pid})`);
            try {
                pty.kill();
            } catch (err) {
                // Already dead
            }
        });

        ws.on('error', (err) => {
            console.error(`[Terminal] WebSocket error:`, err.message);
            try {
                pty.kill();
            } catch (e) {
                // Already dead
            }
        });

    } catch (err) {
        console.error('[Terminal] Failed to spawn PTY:', err.message);
        ws.send(JSON.stringify({
            type: 'output',
            data: `\r\n\x1b[31mError: Failed to start terminal.\r\n${err.message}\x1b[0m\r\n`
        }));
        ws.close();
    }
}

module.exports = { setupTerminal };
