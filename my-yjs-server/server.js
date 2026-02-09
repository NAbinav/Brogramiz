const WebSocket = require("ws");
const http = require("http");
const path = require("path");

// This finds the actual file on your disk, bypassing Node's 'exports' restriction
const utilsPath = path.join(
  path.dirname(require.resolve("y-websocket")),
  "bin",
  "utils.js",
);
const { setupWSConnection } = require(utilsPath);

const port = process.env.PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Yjs WebSocket Server is active");
});

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
  console.log(
    `[${new Date().toLocaleTimeString()}] Client connected to room: ${req.url}`,
  );
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(port, () => {
  console.log(`---`);
  console.log(`✅ Yjs Server running on port: ${port}`);
  console.log(`🔗 WebSocket URL: ws://localhost:${port}`);
  console.log(`---`);
});
