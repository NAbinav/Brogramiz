from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
import json
from typing import Dict, Set
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class WebSocketCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.type == "websocket":
            return await call_next(request)
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(WebSocketCORSMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Store active connections and documents per room
class RoomManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.room_documents: Dict[str, bytearray] = {}
        self.room_awareness: Dict[str, Dict] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = set()
            self.room_documents[room] = bytearray()
            self.room_awareness[room] = {}
            logger.info(f"📝 Created room: {room}")
        
        self.active_connections[room].add(websocket)
        logger.info(f"✅ Client connected to room: {room}")

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_connections:
            self.active_connections[room].discard(websocket)
            logger.info(f"❌ Client disconnected from room: {room}")

    async def broadcast_to_room(self, room: str, message: dict, sender: WebSocket = None):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Error sending message: {e}")

    async def broadcast_to_all_in_room(self, room: str, message: dict):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")

    def get_room_state(self, room: str) -> list:
        if room in self.room_documents:
            return list(self.room_documents[room])
        return []

    def apply_update(self, room: str, update: list):
        if room in self.room_documents:
            self.room_documents[room].extend(update)

    def set_awareness(self, room: str, client_id: str, data: dict):
        if room in self.room_awareness:
            self.room_awareness[room][client_id] = data

room_manager = RoomManager()


@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await room_manager.connect(room, websocket)
    client_id = id(websocket)
    
    try:
        # Send initial sync state
        state = room_manager.get_room_state(room)
        await websocket.send_json({
            "type": "sync",
            "state": state
        })
        logger.info(f"🔄 Synced client to room {room}")

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle document updates
            if message["type"] == "update":
                update = message.get("update", [])
                room_manager.apply_update(room, update)
                
                # Broadcast update to other clients
                await room_manager.broadcast_to_room(
                    room,
                    {
                        "type": "update",
                        "update": update
                    },
                    sender=websocket
                )
                logger.info(f"📤 Broadcasted update in room {room}")

            # Handle awareness (presence/cursors)
            elif message["type"] == "awareness":
                awareness_data = message.get("data", {})
                room_manager.set_awareness(room, str(client_id), awareness_data)
                
                # Broadcast awareness to all clients
                await room_manager.broadcast_to_room(
                    room,
                    {
                        "type": "awareness",
                        "clientId": str(client_id),
                        "data": awareness_data
                    },
                    sender=websocket
                )
                logger.info(f"👁️ Updated awareness in room {room}")

    except WebSocketDisconnect:
        room_manager.disconnect(room, websocket)
        logger.info(f"Client {client_id} disconnected from room {room}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        room_manager.disconnect(room, websocket)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Yjs FastAPI server is running"}


@app.get("/rooms")
async def get_rooms():
    """Get list of active rooms"""
    return {
        "rooms": list(room_manager.active_connections.keys()),
        "count": len(room_manager.active_connections)
    }


@app.get("/rooms/{room}")
async def get_room_info(room: str):
    """Get info about a specific room"""
    if room not in room_manager.active_connections:
        return {"error": "Room not found"}, 404
    
    return {
        "room": room,
        "clients": len(room_manager.active_connections[room]),
        "state_size": len(room_manager.room_documents[room])
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Yjs FastAPI server starting on ws://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8001)

