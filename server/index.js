const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { setupTerminal } = require('./services/terminal');
const examRoutes = require('./routes/exam');
const clusterRoutes = require('./routes/cluster');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/exam', examRoutes);
app.use('/api/cluster', clusterRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/terminal')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// WebSocket server for terminal
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/terminal') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, request) => {
  setupTerminal(ws);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CKA Exam Simulator running on http://0.0.0.0:${PORT}`);
  console.log(`   Terminal WebSocket on ws://0.0.0.0:${PORT}/terminal`);
  console.log(`   API available at http://0.0.0.0:${PORT}/api\n`);
});
