from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from run import run
from line_suggestion import line_ai_agent
from full_suggestion import full_ai_agent
from typing import Dict, List

from ai_explain import ai_agent,call_llm
from typing import Dict, List
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# In-memory room manager


@app.get("/", response_class=HTMLResponse)
async def get_editor(request: Request):
    return templates.TemplateResponse(
        "editor.html",
        {
            "request": request,
            "content": "// Start typing your code here...",
            "output": "",
            "input": "",
            "language": "",
        },
    )


@app.post("/line_ai", response_class=PlainTextResponse)
async def line_ai(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    suggestion = call_llm(language=language,code=code,prompt=open("./prompts/line.txt").read())
    print(suggestion)
    return suggestion

@app.post("/full_ai", response_class=PlainTextResponse)
async def full_ai(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    suggestion = call_llm(language=language,code=code,prompt=open("./prompts/file.txt").read())
    print(suggestion)
    return suggestion



@app.post("/bug_fix", response_class=PlainTextResponse)

async def bug_fix(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    suggestion = call_llm(language=language, code=code,prompt=open("./prompts/bug_fix.txt").read())
    return suggestion

@app.post("/explain", response_class=PlainTextResponse)

async def explain(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    suggestion = call_llm(language=language, 
                               code=code,prompt=open("./prompts/explain.txt").read())
    return suggestion







@app.post("/submit", response_class=HTMLResponse)
async def submit_editor_content(
    request: Request,
    editor_content: str = Form(...),
    input_content: str = Form(""),
    language: str = Form("cpp"),
):
    output = run(input_content, editor_content, language)
    return templates.TemplateResponse(
        "editor.html",
        {
            "request": request,
            "content": editor_content,
            "output": output,
            "input": input_content,
            "language": language,
        },
    )
rooms: Dict[str, Dict[str, any]] = {}

@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    await websocket.accept()

    # Wait for authentication message
    try:
        auth_message = await websocket.receive_text()
        if not auth_message.startswith("AUTH:"):
            await websocket.send_text("ERROR:Authentication required.")
            await websocket.close()
            return
        password = auth_message.replace("AUTH:", "").strip()

        if room_name not in rooms:
            # Create new room
            rooms[room_name] = {"code": "", "clients": [], "password": password}
        else:
            # Check password
            if rooms[room_name]["password"] != password:
                await websocket.send_text("ERROR:Invalid room password.")
                await websocket.close()
                return

        # Send current code to new user
        await websocket.send_text(rooms[room_name]["code"])

        # Add client
        rooms[room_name]["clients"].append(websocket)

        while True:
            data = await websocket.receive_text()
            # Broadcast to all other clients
            rooms[room_name]["code"] = data
            for client in rooms[room_name]["clients"]:
                if client != websocket:
                    await client.send_text(data)

    except WebSocketDisconnect:
        print(f"Client disconnected from room {room_name}")
    finally:
        if not rooms[room_name]["clients"]:
            del rooms[room_name]

