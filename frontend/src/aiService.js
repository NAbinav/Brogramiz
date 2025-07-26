// aiService.js
export function initAIService(editor) {
  function showLoading(message) {
    const output = document.querySelector('.output');
    output.innerHTML = `<span style="color: #60a5fa;">⏳ ${message}</span>`;
  }

  function showError(message) {
    const output = document.querySelector('.output');
    output.innerHTML = `<span style="color: #ef4444;">❌ ${message}</span>`;
  }

  function showExplanation(explanation) {
    const output = document.querySelector('.output');
    output.innerHTML = `<span style="color: #10b981;">💡 Code Explanation:</span>\n\n${explanation}`;
  }

  async function getLineCompletion(code, language) {
    try {
      showLoading('Getting AI line completion...');
      const response = await fetch('/line_ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (response.ok) {
        const data = await response.text();
        editor.insertAtCursor(data);
      } else {
        showError('Error getting AI line completion');
      }
    } catch (error) {
      showError('Network error occurred while getting AI suggestion');
    }
  }

  async function getFullCompletion(code, language) {
    try {
      showLoading('Getting full AI completion...');
      const response = await fetch('/full_ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (response.ok) {
        const data = await response.json();
        editor.setValue(data.output);
      } else {
        showError('Error getting full AI completion');
      }
    } catch (error) {
      showError('Network error occurred while getting AI suggestion');
    }
  }

  async function explainCode(code, language) {
    try {
      showLoading('Getting code explanation...');
      const response = await fetch('/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (response.ok) {
        const data = await response.text();
        showExplanation(data);
      } else {
        showError('Error getting code explanation');
      }
    } catch (error) {
      showError('Network error occurred while getting explanation');
    }
  }

  async function fixBugs(code, language) {
    try {
      showLoading('Fixing bugs...');
      const response = await fetch('/bug_fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (response.ok) {
        const data = await response.text();
        editor.setValue(data);
      } else {
        showError('Error getting bug fix');
      }
    } catch (error) {
      showError('Network error occurred while fixing bugs');
    }
  }

  // Setup keyboard shortcuts
  document.addEventListener('keydown', async (e) => {
    const code = editor.getValue();
    const language = document.getElementById('language').value;

    if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await getLineCompletion(code, language);
    }

    if (e.ctrlKey && e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      await getFullCompletion(code, language);
    }

    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      await explainCode(code, language);
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      await fixBugs(code, language);
    }
  });

  // Return public methods if needed
  return {
    getLineCompletion,
    getFullCompletion,
    explainCode,
    fixBugs
  };
}