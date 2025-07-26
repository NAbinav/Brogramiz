// codeRunner.js
export function initCodeRunner(editor) {
  function formatError(title, message) {
    return `
      <div style="color: #ef4444;">
        <strong>❌ ${title}:</strong>
        <div style="margin-top: 8px; white-space: pre-wrap;">${message}</div>
      </div>
    `;
  }

  function displaySuccess(data) {
    const outputDiv = document.querySelector('.output');
    const output = data.output || data.result || data;
    
    outputDiv.innerHTML = `
      <div style="color: #10b981;">
        <strong>✅ Execution Result:</strong>
        <pre style="margin-top: 8px;">${
          typeof output === 'object' 
            ? JSON.stringify(output, null, 2) 
            : output
        }</pre>
      </div>
    `;
  }

  function displayError(error) {
    const outputDiv = document.querySelector('.output');
    outputDiv.innerHTML = formatError('Error', error.message || error.toString());
  }

  function handleErrorResponse(errorData) {
    const outputDiv = document.querySelector('.output');
    
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        const errors = errorData.detail.map(err => 
          `${err.loc?.join('.').replace('body.', '')}: ${err.msg}`
        );
        outputDiv.innerHTML = formatError('Validation Error', errors.join('<br>'));
      } else {
        outputDiv.innerHTML = formatError('Error', errorData.detail);
      }
    } else {
      outputDiv.innerHTML = formatError('Error', JSON.stringify(errorData, null, 2));
    }
  }

  async function handleSubmit(e) {
  e.preventDefault();
  
  const outputDiv = document.querySelector('.output');
  outputDiv.innerHTML = '<span style="color: #60a5fa;">⏳ Running code...</span>';

  try {
    const code = editor.getValue();
    const input = document.querySelector('textarea[name="input_content"]').value;
    const language = document.getElementById('language').value;

    if (!code.trim()) {
      throw new Error('Code cannot be empty');
    }

    const response = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editor_content: code,
        input_content: input,
        language: language
      })
    });

    const data = await response.json();

    if (!response.ok) {
      handleErrorResponse(data);
      return;
    }

    displaySuccess(data);
  } catch (error) {
    displayError(error);
  }
}
  // Setup form handler
  const form = document.getElementById('code-form');
  form.addEventListener('submit', handleSubmit);

  // Return public methods if needed
  return {
    handleSubmit
  };
}