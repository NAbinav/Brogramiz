// formSubmission.js
import { getEditor } from "./editor.js";

export function setupFormSubmission() {
  document.getElementById("code-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const editor = getEditor();
    const code = editor.getValue();
    const input = document.querySelector('textarea[name="input_content"]').value;
    const language = document.getElementById("language").value;

    const outputDiv = document.querySelector(".output");
    outputDiv.innerHTML = "⏳ Running code...";

    const formData = new FormData();
    formData.append("editor_content", code);
    formData.append("input_content", input);
    formData.append("language", language);

    try {
      const response = await fetch("/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const htmlResponse = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlResponse, "text/html");

        const outputElement = doc.querySelector(".output");
        if (outputElement) {
          const outputContent = outputElement.textContent || outputElement.innerText || "";
          if (outputContent.trim()) {
            outputDiv.textContent = outputContent;
          } else {
            outputDiv.innerHTML = "✅ Code executed successfully (no output)";
          }
        } else {
          outputDiv.innerHTML = "✅ Code executed successfully";
        }
      } else {
        const errorText = await response.text();
        outputDiv.innerHTML = `<span style="color: #ef4444;">❌ Error (${response.status}): ${errorText || 'Failed to run code'}</span>`;
      }
    } catch (error) {
      outputDiv.innerHTML = `<span style="color: #ef4444;">❌ Network error: ${error.message}</span>`;
    }
  });
}

