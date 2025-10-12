import { useEffect, useState, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { languageConfigs } from "../lib/langConfig.js"
import "./App.css"

function useEditorSetup(monaco, language) {
  useEffect(() => {
    if (!monaco || !languageConfigs[language]) return;

    const { snippets } = languageConfigs[language];

    const provider = monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: () => ({
        suggestions: snippets.map(snippet => ({
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

function LanguageSelector({ language, onChange }) {
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

function CodeEditor({ language, value, onChange }) {
  const monaco = useMonaco();
  useEditorSetup(monaco, language);

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language === "go" ? "go" : language}
        value={value}
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
}

function OutputPanel({ output }) {
  return (
    <div className="output-panel">
      <label>Output:</label>
      <pre>{output || "No output yet..."}</pre>
    </div>
  );
}

function SubmitButton({ onClick, loading, text, loading_text }) {
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

function ResizablePanels({ editor, output }) {
  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const container = containerRef.current;
    const newWidth = ((e.clientX - container.getBoundingClientRect().left) / container.clientWidth) * 100;

    if (newWidth > 20 && newWidth < 80) {
      setEditorWidth(newWidth);
    }
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
      <div style={{ width: `${editorWidth}%` }} className="panel">
        {editor}
      </div>
      <div
        className="divider"
        onMouseDown={handleMouseDown}
      />
      <div style={{ width: `${100 - editorWidth}%` }} className="panel">
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editor_content: editorContent,
          language: language
        })
      });

      if (!response.ok) {
        const error = await response.json();
        setOutput(`Error: ${JSON.stringify(error)}`);
        return;
      }

      const data = await response.json();
      setOutput(data.output || "No output");
    } catch (err) {
      setOutput(`Request failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const lineai = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/line_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorContent, language })
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setEditorContent(data.finished_code);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fullai = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/full_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorContent, language })
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setEditorContent(data.finished_code);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bug_fix = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/bug_fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorContent, language })
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setEditorContent(data.finished_code);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const explain = async () => {
    setLoading(true);
    try {
      const response = await fetch("api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorContent, language })
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setOutput(data.finished_code);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="controls">
        <LanguageSelector language={language} onChange={setLanguage} />
        <SubmitButton onClick={handleSubmit} loading={loading} text="Run Code" loading_text="Running..." />
        <SubmitButton onClick={lineai} loading={loading} text="Generate Line AI" loading_text="Generating..." />
        <SubmitButton onClick={fullai} loading={loading} text="Generate Full AI" loading_text="Generating..." />
        <SubmitButton onClick={bug_fix} loading={loading} text="Fix Bug" loading_text="Fixing..." />
        <SubmitButton onClick={explain} loading={loading} text="Explain Code" loading_text="Loading..." />
      </div>

      <ResizablePanels
        editor={<CodeEditor language={language} value={editorContent} onChange={(val) => setEditorContent(val || "")} />}
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
