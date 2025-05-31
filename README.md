# ⚡ AI-Powered Online Compiler

An online compiler supporting **C, C++, Java, Python, Go, and HTML**, enhanced with powerful **AI code generation features**. Built with **HTML frontend** and **FastAPI backend**, and secured using **Docker-in-Docker (DinD)** for safe and isolated code execution.

## 🌟 Features

### 🧠 AI Integration
- **`Ctrl + Enter`** → AI completes your current line of code.
- **`Ctrl + Shift + Enter`** → Clears the editor, reads your comments as a prompt, and generates full code using AI.

### 🧪 Language Support
- ✅ C
- ✅ C++
- ✅ Java
- ✅ Python
- ✅ Go
- ✅ HTML

### 🔐 Secure Execution
- Code runs in **isolated Docker containers**.
- Uses **Docker-in-Docker (DinD)** to dynamically spin up and destroy containers per session.
- Prevents unsafe access and ensures safe multi-user execution.

### 🐳 Containerization
- Everything runs in Docker.
- FastAPI backend handles execution requests and AI prompts.
- HTML frontend interacts directly with the FastAPI server via REST APIs.

---

## 🛠 Tech Stack

| Layer       | Technology    |
|-------------|---------------|
| Frontend    | HTML + JavaScript |
| Backend     | FastAPI (Python) |
| AI Model    | Gemini API |
| Execution   | Docker with DinD |
| Sandbox     | Ephemeral Docker containers |
| Communication | REST API (AJAX/fetch) |

---
