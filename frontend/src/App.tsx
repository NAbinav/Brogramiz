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

function LanguageSelector({ language, onChange }: { language: string; onChange: (lang: string) => void }) {
  const languages = [
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "go", label: "Go" },
    { value: "java", label: "Java" }
  ];

  return (
    <div className="language-selector">
      <label htmlFor="lang-select">Language:</label>
      <select
        id="lang-select"
        value={language}
        onChange={(e) => onChange(e.target.value)}
      >
        {languages.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
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

function CodeEditor({ language, roomId, editorContent, setEditorContent }: CodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!monaco || !editorRef.current || !editorReady) {
      console.log('[Monaco-Yjs] Waiting...', { monaco: !!monaco, editor: !!editorRef.current, ready: editorReady });
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
    let initialContentSet = false;
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && !initialContentSet && yText.length === 0 && editorContent) {
        console.log('[Monaco-Yjs] 📝 Setting initial content');
        yText.insert(0, editorContent);
        initialContentSet = true;
      }
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

    yText.observe(() => {
      console.log('[Monaco-Yjs] 📝 Text changed, length:', yText.length);
      if (setEditorContent) {
        setEditorContent(yText.toString());
      }
    });

    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();
      console.log('[Monaco-Yjs] Connected users:', states.size);
    });

    provider.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    // Cleanup
    return () => {
      console.log('[Monaco-Yjs] 🧹 Cleanup');
      binding.destroy();
      provider.destroy();
    };
  }, [monaco, roomId, editorReady]);

  useEditorSetup(monaco, language);

  return (
    <div className="editor-container">
      <Editor
      value={editorContent}
        height="100%"
        theme="vs-dark"
        language={language === 'go' ? 'go' : language}
        defaultValue=""
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
      <label>Output:</label>
      <pre>{output || "No output yet..."}</pre>
    </div>
  );
}

function SubmitButton({ onClick, loading, text, loading_text }: { 
  onClick: () => void; 
  loading: boolean; 
  text: string; 
  loading_text: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`submit-btn ${loading ? "loading" : ""}`}
    >
      {loading ? loading_text : text}
    </button>
  );
}

function ResizablePanels({ editor, output }: { editor: React.ReactNode; output: React.ReactNode }) {
  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const container = containerRef.current;
    const newWidth = ((e.clientX - container.getBoundingClientRect().left) / container.clientWidth) * 100;
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
    <div className="resizable-container" ref={containerRef}>
      <div style={{ width: `${editorWidth}%` }} className="panel">{editor}</div>
      <div className="divider" onMouseDown={handleMouseDown} />
      <div style={{ width: `${100 - editorWidth}%` }} className="panel">{output}</div>
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
        body: JSON.stringify({ code: editorContent, input:inputContent,language:language })
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
        <SubmitButton onClick={() => callApi("submit")} loading={loading} text="Run Code" loading_text="Running..." />
        <SubmitButton onClick={() => callApi("line_ai")} loading={loading} text="Generate Line AI" loading_text="Generating..." />
        <SubmitButton onClick={() => callApi("full_ai")} loading={loading} text="Generate Full AI" loading_text="Generating..." />
        <SubmitButton onClick={() => callApi("bug_fix")} loading={loading} text="Fix Bug" loading_text="Fixing..." />
        <SubmitButton onClick={() => callApi("explain")} loading={loading} text="Explain Code" loading_text="Loading..." />
      </div>
      <ResizablePanels
        editor={<CodeEditor language={language} roomId={roomId} editorContent={editorContent} setEditorContent={setEditorContent} />}
        output={<OutputPanel output={output} />}
      />
      <div className="input-panel">
        <label htmlFor="input-area">Program Input (stdin):</label>
        <textarea
          id="input-area"
          placeholder="Enter input for your program..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />
      </div>
    </div>
  );
}