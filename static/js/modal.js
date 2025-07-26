// modal.js
import { attachWebSocket } from "./websocket.js";

export function openRoomModal() {
  document.getElementById("roomModal").classList.add("show");
}

export function closeRoomModal() {
  document.getElementById("roomModal").classList.remove("show");
}

export function joinRoom() {
  const roomName = document.getElementById("roomNameInput").value.trim();
  const password = document.getElementById("roomPasswordInput").value;

  if (!roomName) {
    alert("Please enter a room name");
    return;
  }

  attachWebSocket(roomName, password);
  closeRoomModal();
}

