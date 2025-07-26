// main.js
import { initEditor, setEditorMode } from "./editor.js";
import { setupFormSubmission } from "./formSubmission.js";
import { openRoomModal, closeRoomModal, joinRoom } from "./modal.js";

window.addEventListener("DOMContentLoaded", () => {
  const defaultLang = document.getElementById("language").value || "cpp";
  initEditor(defaultLang);
  setupFormSubmission();

  document.getElementById("language").addEventListener("change", async function () {
    const mode = await import("./utils.js").then(({ loadCodeMirror }) => loadCodeMirror(this.value));
    setEditorMode(mode);
  });

  document.getElementById("roomModal").addEventListener("click", function (e) {
    if (e.target === this) {
      closeRoomModal();
    }
  });

  // Assuming you have buttons somewhere to open and join rooms:
  document.getElementById("openRoomBtn").addEventListener("click", openRoomModal);
  document.getElementById("joinRoomBtn").addEventListener("click", joinRoom);
});

