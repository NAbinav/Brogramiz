import { useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

export default function App() {
  const [language, setLanguage] = useState("python");
  const [editorContent, setEditorContent] = useState("");
  const [inputContent, setInputContent] = useState("");
  const [output, setOutput] = useState("");
  const monaco = useMonaco();

  // --- Setup autocomplete for multiple languages ---
  useEffect(() => {
    if (!monaco) return;

    const languages: Record<string, { keywords: string[]; snippets: any[] }> = {
      python: {
        keywords: ["def", "class", "for", "if", "while", "try", "import", "return"],
        snippets: [
          {
            label: "main",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "if __name__ == \"__main__\":\n\t$0",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "Main entry point guard"
          }
        ]
      },
      c: {
        keywords: ["int", "return", "if", "else", "for", "while", "struct", "switch"],
        snippets: [
          {
            label: "main",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "#include <stdio.h>\n\nint main() {\n\t$0\n\treturn 0;\n}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "C main function"
          }
        ]
      },
      cpp: {
        keywords: ["int", "return", "if", "else", "for", "while", "class", "public", "private"],
        snippets: [
          {
            label: "main",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "#include <iostream>\nusing namespace std;\n\nint main() {\n\t$0\n\treturn 0;\n}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "C++ main function"
          }
        ]
      },
      golang: {
        keywords: ["package", "import", "func", "return", "if", "else", "for", "go"],
        snippets: [
          {
            label: "main",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "package main\n\nimport \"fmt\"\n\nfunc main() {\n\t$0\n}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "Go main function"
          }
        ]
      },
      java: {
        keywords: ["class", "public", "private", "static", "void", "int", "return", "new"],
        snippets: [
          {
            label: "main",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "public class Main {\n\tpublic static void main(String[] args) {\n\t\t$0\n\t}\n}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: "Java main method"
          }
        ]
      }
    };

    Object.entries(languages).forEach(([lang, { keywords, snippets }]) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: () => {
          const suggestions: monaco.languages.CompletionItem[] = [];
          keywords.forEach(k =>
            suggestions.push({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              documentation: `${lang} keyword`
            })
          );
          suggestions.push(...snippets);
          return { suggestions };
        }
      });
    });
  }, [monaco]);

  // --- Submit to backend ---
  const handleSubmit = async () => {
    try {
      const response = await fetch("api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editor_content: editorContent,
          input_content: inputContent,
          language:language
        })
      });

      if (!response.ok) {
        const error = await response.json();
        setOutput("Error: " + JSON.stringify(error));
        return;
      }

      const data = await response.json();
      setOutput(data.output || "No output");
    } catch (err) {
      setOutput("Request failed: " + err);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Language Dropdown */}
      <select
        value={language}
        onChange={e => setLanguage(e.target.value)}
        style={{ margin: "10px", padding: "5px", fontSize: "16px" }}
      >
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="golang">Go</option>
        <option value="java">Java</option>
      </select>

      {/* Monaco Editor */}
      <Editor
        height="60%"
        theme="vs-dark"
        language={language}
        value={editorContent}
        onChange={val => setEditorContent(val || "")}
      />

      {/* Input Area */}
      <textarea
        placeholder="Program input (stdin)"
        value={inputContent}
        onChange={e => setInputContent(e.target.value)}
        style={{ margin: "10px", height: "100px", fontSize: "14px" }}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={{
          margin: "10px",
          padding: "10px",
          fontSize: "16px",
          background: "teal",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Submit
      </button>

      {/* Output Panel */}
      <pre
        style={{
          margin: "10px",
          padding: "10px",
          background: "#111",
          color: "lime",
          height: "200px",
          overflowY: "auto"
        }}
      >
        {output}
      </pre>
    </div>
  );
}