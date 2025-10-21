from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.responses import HTMLResponse, PlainTextResponse,JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from run import run
from typing import Dict, List
from fastapi.middleware.cors import CORSMiddleware
origins=["localhost:8080","localhost:5173"]

# from ai_explain import ai_agent,call_llm
from typing import Dict, List
from check_groq import  lineai
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/line_ai", response_class=PlainTextResponse)
async def line_ai(
    request: Request,
    data: dict  # Changed to accept JSON
):
    data = await request.json()
    code = data.get("code", "")
    # language = data.get("language", "")
    # print(language)
    suggestion = lineai(code=code,system_prompt=open("./prompts/line.txt").read())
    print(suggestion)
    return JSONResponse(content=suggestion)


@app.post("/full_ai", response_class=PlainTextResponse)
async def full_ai(
    request: Request,
    data: dict  # Changed to accept JSON
):
    data = await request.json()
    code = data.get("code", "")
    # language = data.get("language", "")
    # print(language)
    suggestion = lineai(code=code,system_prompt=open("./prompts/full.txt").read())
    print(suggestion)
    return JSONResponse(content=suggestion)

@app.post("/bug_fix", response_class=PlainTextResponse)
async def bug_fix(
    request: Request,
    data: dict  # Changed to accept JSON
):
    data = await request.json()
    code = data.get("code", "")
    # language = data.get("language", "")
    # print(language)
    suggestion = lineai(code=code,system_prompt=open("./prompts/bug_fix.txt").read())
    print(suggestion)
    return JSONResponse(content=suggestion)



@app.post("/explain", response_class=PlainTextResponse)
async def explain(
    request: Request,
    data: dict  # Changed to accept JSON
):
    data = await request.json()
    code = data.get("code", "")
    suggestion = lineai(code=code,system_prompt=open("./prompts/explain.txt").read())
    return JSONResponse(content=suggestion)


@app.post("/submit")
async def submit_editor_content(
    request: Request,
    data: dict  # Changed to accept JSON
):
    editor_content = data.get("editor_content", "")
    input_content = data.get("input_content", "")
    language = data.get("language", "cpp")
    
    if not editor_content:
        raise HTTPException(status_code=422, detail=[{
            "loc": ["body", "editor_content"],
            "msg": "Field required",
            "type": "missing"
        }])
    
    output = run(input_content, editor_content, language)
    print(output)
    return {"output": output}
# rooms: Dict[str, Dict[str, any]] = {}

# @app.websocket("/ws/{room_name}")
# async def websocket_endpoint(websocket: WebSocket, room_name: str):
#     await websocket.accept()
#
#     # Wait for authentication message
#     try:
#         auth_message = await websocket.receive_text()
#         if not auth_message.startswith("AUTH:"):
#             await websocket.send_text("ERROR:Authentication required.")
#             await websocket.close()
#             return
#         password = auth_message.replace("AUTH:", "").strip()
#
#         if room_name not in rooms:
#             # Create new room
#             rooms[room_name] = {"code": "", "clients": [], "password": password}
#         else:
#             # Check password
#             if rooms[room_name]["password"] != password:
#                 await websocket.send_text("ERROR:Invalid room password.")
#                 await websocket.close()
#                 return
#
#         # Send current code to new user
#         await websocket.send_text(rooms[room_name]["code"])
#
#         # Add client
#         rooms[room_name]["clients"].append(websocket)
#
#         while True:
#             data = await websocket.receive_text()
#             # Broadcast to all other clients
#             rooms[room_name]["code"] = data
#             for client in rooms[room_name]["clients"]:
#                 if client != websocket:
#                     await client.send_text(data)
#
#     except WebSocketDisconnect:
#         print(f"Client disconnected from room {room_name}")
#     finally:
#         if not rooms[room_name]["clients"]:
#             del rooms[room_name]
#
