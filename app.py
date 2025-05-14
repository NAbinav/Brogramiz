from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
from run import run
from line_suggestion import line_ai_agent
from full_suggestion import full_ai_agent

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


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
