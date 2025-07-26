import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting } from "@codemirror/language";
import { keymap } from '@codemirror/view';
import { defaultHighlightStyle } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { foldKeymap } from '@codemirror/language';

// Language support
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { html } from '@codemirror/lang-html';
import { go } from '@codemirror/lang-go';

export function initEditor() {
  const container = document.getElementById('editor');
  if (!container) {
    console.error('Editor container not found');
    return null;
  }

  // Clear any existing content
  container.innerHTML = '';

  let currentLanguage = 'cpp';
  let onChangeCallback = null;
  let view = null;

  // Language configuration
  const languageSupport = {
    cpp: cpp(),
    c: cpp(),
    python: python(),
    java: java(),
    html: html(),
    go: go()
  };
    //   const myHighlightStyle = HighlightStyle.define([
    //     {tag: tags.keyword,          color: "#FC6"},
    //     {tag: tags.comment,          color: "#16A004", fontStyle: "italic"},
    //     {tag: tags.strong,           color: "#66D9EF", fontStyle: "bold"},
        
    // ]);

  // Default code templates
  const codeTemplates = {
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    python: `print("Hello, World!")`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,
    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`
  };

  // Create editor state
  function createEditorState(language) {
    return EditorState.create({
      doc: codeTemplates[language] || codeTemplates.cpp,
      extensions: [
        basicSetup,
        oneDark,
        languageSupport[language] || cpp,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // closeBrackets(),
        autocompletion({ activateOnTyping: true, closeOnBlur: false }),

        keymap.of([
          indentWithTab,
          ...completionKeymap,
          ...searchKeymap,
          ...foldKeymap
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged && onChangeCallback) {
            onChangeCallback(getValue());
          }
        })
      ]
    });
  }

  // Initialize editor
  function init() {
    view = new EditorView({
      state: createEditorState(currentLanguage),
      parent: container,
      extensions: [
        basicSetup,
        oneDark,
        languageSupport[language] || cpp,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // closeBrackets(),
        autocompletion({
          activateOnTyping: true,
  override: [
    context => {
      let word = context.matchBefore(/\w*/);
      if (!word || (word.from == word.to && !context.explicit)) return null;
      return {
        from: word.from,
        options: [
          { label: "int", type: "keyword" },
          { label: "return", type: "keyword" },
          { label: "main", type: "function" },
          { label: "cout", type: "variable" },
          { label: "include", type: "keyword" }
        ]
      };
    }
  ]}
        ),

        keymap.of([
          indentWithTab,
          ...completionKeymap,
          ...searchKeymap,
          ...foldKeymap
        ])]
    });
  }

  // Public API
  function setLanguage(language) {
    if (!languageSupport[language] || currentLanguage === language) return;
    currentLanguage = language;
    
    const state = createEditorState(language);
    view.setState(state);
  }

  function getValue() {
    return view?.state.doc.toString() || '';
  }

  function setValue(code) {
    if (!view) return;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: code || ''
      }
    });
  }

  function insertAtCursor(text) {
    if (!view) return;
    const cursor = view.state.selection.main.head;
    view.dispatch({
      changes: { from: cursor, to: cursor, insert: text },
      selection: { anchor: cursor + text.length }
    });
  }

  function onChange(callback) {
    onChangeCallback = callback;
  }

  function focus() {
    view?.focus();
  }

  // Initialize
  init();

  return {
    setLanguage,
    getValue,
    setValue,
    insertAtCursor,
    onChange,
    focus,
  };
}