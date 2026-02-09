import { useState, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import './App.css';

// Language configurations
const LANGUAGES = [
  { id: 'c', name: 'C', monaco: 'c' },
  { id: 'cpp', name: 'C++', monaco: 'cpp' },
  { id: 'java', name: 'Java', monaco: 'java' },
  { id: 'python', name: 'Python', monaco: 'python' },
  { id: 'go', name: 'Go', monaco: 'go' },
];

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  python: 'def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
};

interface SubmitButtonProps {
  onClick: () => void;
  loading: boolean;
  text: string;
  loading_text: string;
}

const SubmitButton = ({ onClick, loading, text, loading_text }: SubmitButtonProps) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="submit-button"
  >
    {loading ? loading_text : text}
  </button>
);

function App() {
  const [language, setLanguage] = useState('python');
  const [editorContent, setEditorContent] = useState(DEFAULT_CODE.python);
  const [inputContent, setInputContent] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState('default-room');
  const [isCollaborative, setIsCollaborative] = useState(false);
  // Default to your local server
  const [wsUrl, setWsUrl] = useState('/yjs');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState(0);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  const handleEditorDidMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;

    // If we started in collab mode (unlikely but possible), setup now
    if (isCollaborative) {
      setupCollaboration(editorInstance);
    }
  };

  const setupCollaboration = (editorInstance: editor.IStandaloneCodeEditor) => {
    // 1. Clean up any existing connection
    cleanupCollaboration();

    setConnectionStatus('connecting');

    // 2. Create new Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const ytext = ydoc.getText('monaco');
    ytextRef.current = ytext;

    // 3. Create WebSocket provider
    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
    providerRef.current = provider;

    // 4. Attach Status Listeners
    provider.on('status', (event: { status: 'connected' | 'disconnected' }) => {
      console.log('WebSocket status:', event.status);
      setConnectionStatus(event.status === 'connected' ? 'connected' : 'disconnected');
    });

    provider.ws.onopen = () => {
      console.log('[WS] open')
    }

    provider.ws.onerror = err => {
      console.error('[WS] error', err)
    }

    // 5. Track User Count (Awareness)
    provider.awareness.on('change', () => {
      setConnectedUsers(Array.from(provider.awareness.getStates().values()).length);
    });

    // 6. Bind to Monaco Editor
    const model = editorInstance.getModel();
    if (!model) return;

    // --- CRITICAL FIX: No setTimeout needed here ---
    // Handle initial content sync:
    // If the Yjs document is empty (new session), fill it with our current editor content.
    // If Yjs has content (joining existing session), it will overwrite our editor automatically via binding.
    if (ytext.toString() === '') {
      const currentContent = model.getValue();
      if (currentContent) {
        ytext.insert(0, currentContent);
      }
    } else {
      // Optional: Force update editor to match Yjs if needed, 
      // but MonacoBinding usually handles this.
      const remoteContent = ytext.toString();
      if (remoteContent !== model.getValue()) {
        model.setValue(remoteContent);
      }
    }

    const binding = new MonacoBinding(
      ytext,
      model,
      new Set([editorInstance]),
      provider.awareness
    );
    bindingRef.current = binding;
    console.log('Monaco binding created successfully');
  };

  const cleanupCollaboration = () => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    ytextRef.current = null;
  };

  // --- CRITICAL FIX: Source of Truth ---
  const getCurrentEditorContent = (): string => {
    // Priority 1: What is visibly on the screen (Most accurate)
    if (editorRef.current) {
      return editorRef.current.getValue();
    }
    // Priority 2: Yjs document (if in collab mode and editor not mounted)
    if (isCollaborative && ytextRef.current) {
      return ytextRef.current.toString();
    }
    // Priority 3: Local state fallback
    return editorContent;
  };

  const toggleCollaboration = () => {
    const newState = !isCollaborative;
    setIsCollaborative(newState);

    if (newState) {
      // Turning ON collaboration
      if (editorRef.current) {
        setupCollaboration(editorRef.current);
      }
    } else {
      // Turning OFF collaboration

      // 1. Save the current collaborative text to local state so it doesn't disappear
      if (editorRef.current) {
        setEditorContent(editorRef.current.getValue());
      } else if (ytextRef.current) {
        setEditorContent(ytextRef.current.toString());
      }

      // 2. Disconnect
      cleanupCollaboration();
      setConnectionStatus('disconnected');
      setConnectedUsers(0);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    // Only reset code if we are NOT collaborating to avoid wiping other users' work
    if (!isCollaborative) {
      setEditorContent(DEFAULT_CODE[newLang] || '');
      if (editorRef.current) {
        editorRef.current.setValue(DEFAULT_CODE[newLang] || '');
      }
    }
  };

  const callApi = async (endpoint: string) => {
    setLoading(true);
    try {
      // Get content securely
      const currentCode = getCurrentEditorContent();

      if (!currentCode || currentCode.trim() === '') {
        throw new Error("Editor is empty. Please type some code.");
      }

      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          input: inputContent,
          language: language
        })
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      if (endpoint === "submit" || endpoint === "explain") {
        setOutput(data.output || data.explanation || "No output");
      } else {
        // Handle AI code generation updates
        console.log("New code received:", data.finished_code);

        if (isCollaborative && ytextRef.current && editorRef.current) {
          // In collab mode, we must update via Yjs to propagate changes
          // We replace the entire content securely
          ytextRef.current.delete(0, ytextRef.current.length);
          ytextRef.current.insert(0, data.finished_code);
        } else if (editorRef.current) {
          // In local mode, just set the value
          editorRef.current.setValue(data.finished_code);
          setEditorContent(data.finished_code);
        }
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupCollaboration();
    };
  }, []);

  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢 Connected';
      case 'connecting':
        return '🟡 Connecting...';
      default:
        return '⚪ Disconnected';
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Collaborative Code Editor</h1>
        <div className="header-controls">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-selector"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="collaboration-controls">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID"
              className="room-input"
              disabled={isCollaborative}
            />
            <button
              onClick={toggleCollaboration}
              className={`collab-button ${isCollaborative ? 'active' : ''}`}
            >
              {isCollaborative ? getStatusIndicator() : "Start Collaboration"}
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-section">
          <div className="editor-header">
            <h3>Code Editor</h3>
            {isCollaborative && (
              <span className="collab-indicator">
                Room: {roomId} | Users: {connectedUsers}
              </span>
            )}
          </div>
          <div className="editor-wrapper">
            <Editor
              height="500px"
              language={LANGUAGES.find(l => l.id === language)?.monaco || 'python'}
              // Important: When in collab mode, let Yjs manage the value. 
              // When local, use local state.
              defaultValue={editorContent}
              value={isCollaborative ? undefined : editorContent}
              onChange={(value) => {
                if (!isCollaborative) {
                  setEditorContent(value || '');
                }
              }}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: false,
              }}
            />
          </div>
        </div>

        <div className="side-panel">
          <div className="input-section">
            <h3>Input</h3>
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Enter program input here..."
              className="input-textarea"
            />
          </div>

          <div className="output-section">
            <h3>Output</h3>
            <pre className="output-display">{output || 'No output yet'}</pre>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <SubmitButton
          onClick={() => callApi("submit")}
          loading={loading}
          text="▶ Run Code"
          loading_text="Running..."
        />
        <SubmitButton
          onClick={() => callApi("line_ai")}
          loading={loading}
          text="✨ Generate Line AI"
          loading_text="Generating..."
        />
        <SubmitButton
          onClick={() => callApi("full_ai")}
          loading={loading}
          text="🤖 Generate Full AI"
          loading_text="Generating..."
        />
        <SubmitButton
          onClick={() => callApi("bug_fix")}
          loading={loading}
          text="🔧 Fix Bug"
          loading_text="Fixing..."
        />
        <SubmitButton
          onClick={() => callApi("explain")}
          loading={loading}
          text="📖 Explain Code"
          loading_text="Loading..."
        />
      </div>
    </div>
  );
}

export default App;
