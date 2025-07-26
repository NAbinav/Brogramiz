// roomModal.js
export function initRoomModal(websocketManager) {
  const modal = document.getElementById('roomModal');
  const roomNameInput = document.getElementById('roomNameInput');
  const roomPasswordInput = document.getElementById('roomPasswordInput');

  function showError(message) {
    let errorEl = modal.querySelector('.error-message');
    
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.25rem;
      `;
      
      const modalActions = modal.querySelector('.modal-actions');
      modalActions.parentNode.insertBefore(errorEl, modalActions);
    }
    
    errorEl.textContent = message;
    
    setTimeout(() => {
      if (errorEl && errorEl.parentNode) {
        errorEl.remove();
      }
    }, 5000);
  }

  function joinRoom() {
    const roomName = roomNameInput.value.trim();
    const password = roomPasswordInput.value;
    
    if (!roomName) {
      showError('Please enter a room name');
      roomNameInput.focus();
      return;
    }

    if (roomName.length < 3) {
      showError('Room name must be at least 3 characters long');
      roomNameInput.focus();
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(roomName)) {
      showError('Room name can only contain letters, numbers, hyphens, and underscores');
      roomNameInput.focus();
      return;
    }

    try {
      websocketManager.connect(roomName, password);
      close();
    } catch (error) {
      showError('Failed to connect to room: ' + error.message);
    }
  }

  function open() {
    modal.classList.add('show');
    roomNameInput.focus();
    roomNameInput.value = '';
    roomPasswordInput.value = '';
  }

  function close() {
    modal.classList.remove('show');
  }

  // Setup event listeners
  document.getElementById('joinRoomBtn').addEventListener('click', open);
  document.getElementById('cancelRoomBtn').addEventListener('click', close);
  document.getElementById('joinRoomConfirmBtn').addEventListener('click', joinRoom);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      close();
    }
  });

  roomNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });

  roomPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      close();
    }
  });

  // Return public methods if needed
  return {
    open,
    close,
    joinRoom
  };
}