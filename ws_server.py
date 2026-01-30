import asyncio
import logging
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware  
from y_py import YDoc, encode_state_as_update, apply_update

logging.basicConfig(level=logging.INFO)
app = FastAPI()
ydoc = YDoc()
clients = set()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # WebSocket handshake uses GET
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    await websocket.send_bytes(bytes([0, 1]) + encode_state_as_update(ydoc))
    try:
        while True:
            message = await websocket.receive_bytes()
            if len(message) < 2 or message[0] not in (0, 1):
                continue
            if message[0] == 0 and message[1] in (1, 2) and len(message) > 2:
                apply_update(ydoc, message[2:])
                await asyncio.gather(*(c.send_bytes(message) for c in clients if c != websocket))
            elif message[0] == 1:
                await asyncio.gather(*(c.send_bytes(message) for c in clients if c != websocket))
    except:
        clients.remove(websocket)
