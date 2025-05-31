from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from run import run
from line_suggestion import line_ai_agent
from full_suggestion import full_ai_agent

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# In-memory room manager
rooms = {}  # Dict[str, List[WebSocket]]


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
    suggestion = line_ai_agent(code, language)
    return suggestion.strip()


@app.post("/full_ai", response_class=PlainTextResponse)
async def full_ai(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    suggestion = full_ai_agent(code, language)
    return suggestion.strip()


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


@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    await websocket.accept()

    # Add to room
    if room_name not in rooms:
        rooms[room_name] = []
    rooms[room_name].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast to all in the room
            for conn in rooms[room_name]:
                if conn != websocket:
                    await conn.send_text(data)
    except WebSocketDisconnect:
        # Remove disconnected client
        rooms[room_name].remove(websocket)
        if not rooms[room_name]:
            del rooms[room_name]

