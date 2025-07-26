// websocket.js
import { getEditor } from "./editor.js";

let socket;
let debounceTimer;
let currentRoom = null;

export function attachWebSocket(roomName, password) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  currentRoom = roomName;
  updateConnectionStatus("connecting");

  socket = new WebSocket(`ws://${location.host}/ws/${roomName}`);

  socket.onopen = () => {
    console.log("Connected to room:", roomName);
    socket.send(`AUTH:${password}`);
    updateConnectionStatus("connected");
  };

  socket.onmessage = (event) => {
    const editor = getEditor();
    const remoteCode = event.data;
    if (remoteCode !== editor.getValue()) {
      const cursor = editor.getCursor();
      editor.setValue(remoteCode);
      editor.setCursor(cursor);
    }
  };

  socket.onclose = () => {
    console.log("Disconnected from room.");
    updateConnectionStatus("disconnected");
    currentRoom = null;
  };

  socket.onerror = () => {
    updateConnectionStatus("error");
  };

  const editor = getEditor();
  editor.on("change", () => {
    if (socket.readyState === WebSocket.OPEN) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        socket.send(editor.getValue());
      }, 1);
    }
  });
}

export function updateConnectionStatus(status) {
  const statusDot = document.getElementById("connectionStatus");
  const roomNameEl = document.getElementById("roomName");

  switch (status) {
    case "connected":
      statusDot.className = "status-dot connected";
      roomNameEl.textContent = currentRoom;
      break;
    case "connecting":
      statusDot.className = "status-dot";
      roomNameEl.textContent = "Connecting...";
      break;
    case "disconnected":
    case "error":
      statusDot.className = "status-dot";
      roomNameEl.textContent = "Not Connected";
      break;
  }
}

export { currentRoom };

