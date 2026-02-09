"""
Advanced FastAPI WebSocket server with Yjs CRDT support
Handles operational transformations for true collaborative editing
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Set, List, Optional
import json
import asyncio
from datetime import datetime
import base64

import { useEffect, useState, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { languageConfigs } from "../lib/langConfig.js";
import "./App.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

function useEditorSetup(monaco: any, language: string) {
  useEffect(() => {
    if (!monaco || !languageConfigs[language]) return;

    const { snippets } = languageConfigs[language];
    const provider = monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: () => ({
        suggestions: snippets.map((snippet: any) => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: snippet.doc
        }))
      })
    });

    return () => provider.dispose();
  }, [monaco, language]);
}

function LanguageSelector({
  language,
  onChange
}: {
  language: string;
  onChange: (lang: string) => void;
}) {
  const languages = [
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "go", label: "Go" },
    { value: "java", label: "Java" }
  ];

  return (
    <div className="language-selector">
      Language:
      <select value={language} onChange={(e) => onChange(e.target.value)}>
        {languages.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface CodeEditorProps {
  language: string;
  roomId: string;
  editorContent?: string;
  setEditorContent?: (content: string) => void;
}

function CodeEditor({
  language,
  roomId,
  editorContent,
  setEditorContent
}: CodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const initialContentSetRef = useRef(false);

  // Update Monaco editor language when language prop changes
  useEffect(() => {
    if (!monaco || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (model) {
      console.log('[Monaco] Setting language to:', language);
      monaco.editor.setModelLanguage(model, language);
    }
  }, [monaco, language]);

  // Setup Yjs and WebSocket connection
  useEffect(() => {
    if (!monaco || !editorRef.current || !editorReady) {
      console.log('[Monaco-Yjs] Waiting...', {
        monaco: !!monaco,
        editor: !!editorRef.current,
        ready: editorReady
      });
      return;
    }

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:8000/ws',
      roomId,
      ydoc
    );

    providerRef.current = provider;
    const yText = ydoc.getText('monaco');

    // Set initial content when synced
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && !initialContentSetRef.current && yText.length === 0 && editorContent) {
        console.log('[Monaco-Yjs] 📝 Setting initial content');
        yText.insert(0, editorContent);
        initialContentSetRef.current = true;
      }
    });

    // Handle connection status
    provider.on('status', (event: { status: string }) => {
      console.log('[Monaco-Yjs] Connection status:', event.status);
    });

    console.log('[Monaco-Yjs] 🔗 Creating binding');
    const model = editorRef.current.getModel();
    if (!model) {
      console.error('[Monaco-Yjs] ❌ No model found!');
      return;
    }

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editorRef.current]),
      provider.awareness
    );

    bindingRef.current = binding;
    console.log('[Monaco-Yjs] ✅ Binding created successfully');

    // Observe text changes
    yText.observe(() => {
      console.log('[Monaco-Yjs] 📝 Text changed, length:', yText.length);
      if (setEditorContent) {
        setEditorContent(yText.toString());
      }
    });

    // Monitor connected users
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();
      console.log('[Monaco-Yjs] Connected users:', states.size);
    });

    // Set user info
    provider.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    });

    // Cleanup
    return () => {
      console.log('[Monaco-Yjs] 🧹 Cleanup');
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
    };
  }, [monaco, roomId, editorReady, editorContent, setEditorContent]);

  useEditorSetup(monaco, language);

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={editorContent}
        onChange={(value) => {
          // Only update if not using Yjs (fallback)
          if (!providerRef.current && setEditorContent && value !== undefined) {
            setEditorContent(value);
          }
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          setEditorReady(true);
        }}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

function OutputPanel({ output }: { output: string }) {
  return (
    <div className="output-panel">
      <div className="output-header">Output:</div>
      <pre className="output-content">{output || "No output yet..."}</pre>
    </div>
  );
}

function SubmitButton({
  onClick,
  loading,
  text,
  loading_text
}: {
  onClick: () => void;
  loading: boolean;
  text: string;
  loading_text: string;
}) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? loading_text : text}
    </button>
  );
}

function ResizablePanels({
  editor,
  output
}: {
  editor: React.ReactNode;
  output: React.ReactNode;
}) {
  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const newWidth =
      ((e.clientX - container.getBoundingClientRect().left) /
        container.clientWidth) *
      100;

    if (newWidth > 20 && newWidth < 80) setEditorWidth(newWidth);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="resizable-container">
      <div className="panel editor-panel" style={{ width: `${editorWidth}%` }}>
        {editor}
      </div>
      <div className="divider" onMouseDown={handleMouseDown} />
      <div className="panel output-panel" style={{ width: `${100 - editorWidth}%` }}>
        {output}
      </div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState("python");
  const [editorContent, setEditorContent] = useState("");
  const [inputContent, setInputContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const roomId = "my-room";

  const callApi = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editorContent,
          input: inputContent,
          language: language
        })
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      if (endpoint === "submit" || endpoint === "explain") {
        setOutput(data.output || data.finished_code || "No output");
      } else {
        console.log(data.finished_code);
        setEditorContent(data.finished_code);
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="controls">
        <LanguageSelector language={language} onChange={setLanguage} />
        <SubmitButton
          onClick={() => callApi("submit")}
          loading={loading}
          text="Run Code"
          loading_text="Running..."
        />
        <SubmitButton
          onClick={() => callApi("line_ai")}
          loading={loading}
          text="Generate Line AI"
          loading_text="Generating..."
        />
        <SubmitButton
          onClick={() => callApi("full_ai")}
          loading={loading}
          text="Generate Full AI"
          loading_text="Generating..."
        />
        <SubmitButton
          onClick={() => callApi("bug_fix")}
          loading={loading}
          text="Fix Bug"
          loading_text="Fixing..."
        />
        <SubmitButton
          onClick={() => callApi("explain")}
          loading={loading}
          text="Explain Code"
          loading_text="Loading..."
        />
      </div>

      <ResizablePanels
        editor={
          <CodeEditor
            language={language}
            roomId={roomId}
            editorContent={editorContent}
            setEditorContent={setEditorContent}
          />
        }
        output={<OutputPanel output={output} />}
      />

      <div className="input-section">
        <label htmlFor="program-input">Program Input (stdin):</label>
        <textarea
          id="program-input"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />
      </div>
    </div>
  );
}
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class YjsDocument:
    """Simple CRDT-like document state"""
    def __init__(self):
        self.updates: List[bytes] = []
        self.state_vector: Dict = {}
        self.content: str = ""
    
    def apply_update(self, update: bytes):
        """Apply an update to the document"""
        self.updates.append(update)
    
    def get_state(self) -> bytes:
        """Get current document state"""
        if self.updates:
            return b''.join(self.updates)
        return b''


class Room:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.connections: Set[WebSocket] = set()
        self.document = YjsDocument()
        self.awareness_states: Dict[int, dict] = {}
        self.client_counter = 0
    
    async def add_connection(self, websocket: WebSocket) -> int:
        """Add a new connection and return client ID"""
        await websocket.accept()
        self.connections.add(websocket)
        self.client_counter += 1
        client_id = self.client_counter
        print(f"✅ Client {client_id} joined room {self.room_id}")
        print(f"📊 Total clients: {len(self.connections)}")
        return client_id
    
    def remove_connection(self, websocket: WebSocket):
        """Remove a connection"""
        self.connections.discard(websocket)
        print(f"❌ Client left room {self.room_id}")
        print(f"📊 Remaining clients: {len(self.connections)}")
    
    async def broadcast(self, message: dict, exclude: Optional[WebSocket] = None):
        """Broadcast to all connections except excluded one"""
        disconnected = []
        for conn in self.connections:
            if conn != exclude:
                try:
                    await conn.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting: {e}")
                    disconnected.append(conn)
        
        for conn in disconnected:
            self.remove_connection(conn)
    
    async def broadcast_bytes(self, data: bytes, exclude: Optional[WebSocket] = None):
        """Broadcast binary data"""
        disconnected = []
        for conn in self.connections:
            if conn != exclude:
                try:
                    await conn.send_bytes(data)
                except Exception as e:
                    print(f"Error broadcasting bytes: {e}")
                    disconnected.append(conn)
        
        for conn in disconnected:
            self.remove_connection(conn)


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
    
    def get_room(self, room_id: str) -> Room:
        """Get or create a room"""
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(room_id)
        return self.rooms[room_id]
    
    def cleanup_room(self, room_id: str):
        """Remove room if empty"""
        if room_id in self.rooms and not self.rooms[room_id].connections:
            print(f"🧹 Cleaning up empty room: {room_id}")
            del self.rooms[room_id]


manager = RoomManager()


@app.get("/")
async def root():
    return {
        "message": "Yjs Collaboration Server",
        "version": "1.0.0",
        "active_rooms": len(manager.rooms),
        "rooms": [
            {
                "id": room_id,
                "clients": len(room.connections)
            }
            for room_id, room in manager.rooms.items()
        ]
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    room = manager.get_room(room_id)
    client_id = await room.add_connection(websocket)
    
    try:
        # Send sync message with current document state
        if room.document.get_state():
            await websocket.send_json({
                "type": "sync",
                "sync": 1,
                "state": base64.b64encode(room.document.get_state()).decode()
            })
        
        # Send awareness update about connected users
        await websocket.send_json({
            "type": "awareness",
            "clients": len(room.connections),
            "states": list(room.awareness_states.values())
        })
        
        # Main message loop
        while True:
            try:
                # Try to receive JSON first
                data = await websocket.receive_text()
                message = json.loads(data)
                
                msg_type = message.get("type")
                print(f"📨 Received {msg_type} from client {client_id} in {room_id}")
                
                if msg_type == "sync":
                    # Sync request
                    await handle_sync(websocket, room, message)
                
                elif msg_type == "update":
                    # Document update
                    await handle_update(websocket, room, message)
                
                elif msg_type == "awareness":
                    # Awareness update (cursor position, selection, etc.)
                    await handle_awareness(websocket, room, message, client_id)
                
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except json.JSONDecodeError:
                # Try binary message (Yjs update)
                data = await websocket.receive_bytes()
                room.document.apply_update(data)
                # Broadcast to other clients
                await room.broadcast_bytes(data, exclude=websocket)
    
    except WebSocketDisconnect:
        print(f"🔌 Client {client_id} disconnected from {room_id}")
    except Exception as e:
        print(f"❌ Error for client {client_id}: {e}")
    finally:
        room.remove_connection(websocket)
        
        # Notify others about disconnection
        if room.awareness_states.get(client_id):
            del room.awareness_states[client_id]
        
        await room.broadcast({
            "type": "awareness",
            "clients": len(room.connections),
            "states": list(room.awareness_states.values())
        })
        
        # Cleanup empty rooms
        manager.cleanup_room(room_id)


async def handle_sync(websocket: WebSocket, room: Room, message: dict):
    """Handle sync request"""
    if room.document.get_state():
        await websocket.send_json({
            "type": "sync",
            "sync": 2,
            "state": base64.b64encode(room.document.get_state()).decode()
        })


async def handle_update(websocket: WebSocket, room: Room, message: dict):
    """Handle document update"""
    update_data = message.get("update", "")
    
    if update_data:
        # Decode and store update
        try:
            update_bytes = base64.b64decode(update_data)
            room.document.apply_update(update_bytes)
            
            # Broadcast to other clients
            await room.broadcast({
                "type": "update",
                "update": update_data
            }, exclude=websocket)
        except Exception as e:
            print(f"Error processing update: {e}")


async def handle_awareness(websocket: WebSocket, room: Room, message: dict, client_id: int):
    """Handle awareness update (cursor, selection, user info)"""
    state = message.get("state", {})
    
    if state:
        room.awareness_states[client_id] = {
            "client_id": client_id,
            **state
        }
    
    # Broadcast awareness update
    await room.broadcast({
        "type": "awareness",
        "clients": len(room.connections),
        "states": list(room.awareness_states.values())
    }, exclude=websocket)


if __name__ == "__main__":
    import uvicorn
    print("🚀 Yjs Collaboration Server starting...")
    print("📡 WebSocket endpoint: ws://localhost:8000/ws/{room_id}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
