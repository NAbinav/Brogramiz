// server.js - Simple Yjs WebSocket server
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { setupWSConnection } from "y-websocket/bin/utils";

const PORT = 8000;
const wss = new WebSocketServer({ port: PORT });

const docs = new Map();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const roomName = url.pathname.replace("/ws/", "");

  console.log(`[WebSocket] New connection to room: ${roomName}`);

  setupWSConnection(ws, req, {
    docName: roomName,
    gc: true,
  });

  ws.on("close", () => {
    console.log(`[WebSocket] Connection closed for room: ${roomName}`);
  });
});

console.log(`🚀 Yjs WebSocket server running on ws://localhost:${PORT}`);
