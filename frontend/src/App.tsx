import { useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

// Language configurations with comprehensive snippets
const languageConfigs = {
  python: {
    snippets: [
      {
        label: "main",
        insertText: "if __name__ == \"__main__\":\n\t$0",
        doc: "Main entry point guard"
      },
      {
        label: "def",
        insertText: "def ${1:function_name}(${2:params}):\n\t${3:pass}\n\treturn $0",
        doc: "Function definition"
      },
      {
        label: "class",
        insertText: "class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t$0",
        doc: "Class definition"
      },
      {
        label: "for",
        insertText: "for ${1:item} in ${2:iterable}:\n\t$0",
        doc: "For loop"
      },
      {
        label: "try",
        insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t$0",
        doc: "Try-except block"
      }
    ]
  },
  c: {
    snippets: [
      {
        label: "main",
        insertText: "#include <stdio.h>\n\nint main() {\n\t$0\n\treturn 0;\n}",
        doc: "C main function"
      },
      {
        label: "func",
        insertText: "${1:int} ${2:function_name}(${3:params}) {\n\t$0\n}",
        doc: "Function definition"
      },
      {
        label: "for",
        insertText: "for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t$0\n}",
        doc: "For loop"
      },
      {
        label: "struct",
        insertText: "struct ${1:name} {\n\t${2:int field};\n};",
        doc: "Struct definition"
      }
    ]
  },
  cpp: {
    snippets: [
      {
        label: "main",
        insertText: "#include <iostream>\nusing namespace std;\n\nint main() {\n\t$0\n\treturn 0;\n}",
        doc: "C++ main function"
      },
      {
        label: "class",
        insertText: "class ${1:ClassName} {\nprivate:\n\t${2:int member};\npublic:\n\t${1}();\n\t$0\n};",
        doc: "Class definition"
      },
      {
        label: "vector",
        insertText: "vector<${1:int}> ${2:vec};",
        doc: "Vector declaration"
      }
    ]
  },
  go: {
    snippets: [
      {
        label: "main",
        insertText: "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t$0\n}",
        doc: "Go main function"
      },
      {
        label: "func",
        insertText: "func ${1:name}(${2:params}) ${3:returnType} {\n\t$0\n}",
        doc: "Function definition"
      },
      {
        label: "struct",
        insertText: "type ${1:Name} struct {\n\t${2:Field} ${3:Type}\n}",
        doc: "Struct definition"
      }
    ]
  },
  java: {
    snippets: [
      {
        label: "main",
        insertText: "public class Main {\n\tpublic static void main(String[] args) {\n\t\t$0\n\t}\n}",
        doc: "Java main method"
      },
      {
        label: "class",
        insertText: "public class ${1:ClassName} {\n\t${2:// fields}\n\t\n\tpublic ${1}() {\n\t\t$0\n\t}\n}",
        doc: "Class definition"
      },
      {
        label: "method",
        insertText: "public ${1:void} ${2:methodName}(${3:params}) {\n\t$0\n}",
        doc: "Method definition"
      }
    ]
  }
};

// Monaco editor configuration hook
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

// Language selector component
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

// Code editor component
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

// Input panel component
function InputPanel({ value, onChange }) {
  return (
    <div className="input-panel">
      <label htmlFor="input-area">Program Input (stdin):</label>
      <textarea
        id="input-area"
        placeholder="Enter input for your program..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Output panel component
function OutputPanel({ output }) {
  return (
    <div className="output-panel">
      <label>Output:</label>
      <pre>{output || "No output yet..."}</pre>
    </div>
  );
}

// Submit button component
function SubmitButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`submit-btn ${loading ? "loading" : ""}`}
    >
      {loading ? "Running..." : "Run Code"}
    </button>
  );
}

// Main app component
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
          input_content: inputContent,
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

  return (
    <div className="app">
      <style jsx>{`
        .app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .language-selector {
          padding: 16px;
          background: #252526;
          border-bottom: 1px solid #3c3c3c;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .language-selector label {
          font-weight: 500;
          color: #cccccc;
        }

        .language-selector select {
          padding: 8px 12px;
          background: #3c3c3c;
          color: #fff;
          border: 1px solid #4a4a4a;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
          cursor: pointer;
        }

        .language-selector select:hover {
          border-color: #007acc;
        }

        .editor-container {
          flex: 1;
          min-height: 0;
          border-bottom: 1px solid #3c3c3c;
        }

        .input-panel {
          padding: 16px;
          background: #252526;
          border-bottom: 1px solid #3c3c3c;
        }

        .input-panel label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #cccccc;
        }

        .input-panel textarea {
          width: 100%;
          height: 80px;
          padding: 12px;
          background: #1e1e1e;
          color: #fff;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          resize: vertical;
          outline: none;
        }

        .input-panel textarea:focus {
          border-color: #007acc;
        }

        .submit-btn {
          margin: 16px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #007acc, #005a9e);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #005a9e, #004578);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .submit-btn.loading {
          position: relative;
        }

        .output-panel {
          padding: 16px;
          background: #0d1117;
          flex: 1;
          min-height: 120px;
          display: flex;
          flex-direction: column;
        }

        .output-panel label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #58a6ff;
        }

        .output-panel pre {
          flex: 1;
          padding: 12px;
          background: #161b22;
          color: #7ee787;
          border: 1px solid #30363d;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          overflow: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
        }
      `}</style>

      <LanguageSelector 
        language={language} 
        onChange={setLanguage} 
      />
      
      <CodeEditor
        language={language}
        value={editorContent}
        onChange={(val) => setEditorContent(val || "")}
      />
      
      <InputPanel
        value={inputContent}
        onChange={setInputContent}
      />
      
      <SubmitButton
        onClick={handleSubmit}
        loading={loading}
      />
      
      <OutputPanel output={output} />
    </div>
  );
}