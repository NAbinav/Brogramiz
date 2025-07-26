import './style.css';
import { initEditor } from './editor.js';
import { initWebSocket } from './websocket.js';
import { initAIService } from './aiService.js';
import { initCodeRunner } from './codeRunner.js';
import { initRoomModal } from './roomModal.js';

// Main initialization
function initBrogramizApp() {
  // Initialize components
  const editor = initEditor();
  const websocketManager = initWebSocket(editor);
  const aiService = initAIService(editor);
  const codeRunner = initCodeRunner(editor);
  const roomModal = initRoomModal(websocketManager);

  // Setup language change handler
  const languageSelect = document.getElementById('language');
  languageSelect.addEventListener('change', (e) => {
    const newLanguage = e.target.value;
    editor.setLanguage(newLanguage);
    console.log(`Language changed to: ${newLanguage}`);
  });

  // Focus editor
  editor.focus();

  console.log('🚀 Brogramiz initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrogramizApp);
} else {
  initBrogramizApp();
}