// websocket.js
export function initWebSocket(editor) {
  let socket = null;
  let currentRoom = null;
  let debounceTimer = null;
  let isConnected = false;
  
  const statusDot = document.getElementById('connectionStatus');
  const roomNameEl = document.getElementById('roomName');

  // Setup editor change listener
  editor.onChange((code) => {
    sendCodeUpdate(code);
  });

  function handleCodeUpdate(remoteCode) {
    if (remoteCode !== editor.getValue()) {
      const selection = editor.view.state.selection;
      editor.setValue(remoteCode);
      
      try {
        const newSelection = Math.min(selection.main.head, remoteCode.length);
        editor.view.dispatch({
          selection: { anchor: newSelection, head: newSelection }
        });
      } catch (e) {
        console.warn('Could not restore cursor position:', e);
      }
    }
  }

  function handleMessage(data) {
    switch(data.type) {
      case 'code_update':
        handleCodeUpdate(data.code);
        break;
      case 'user_joined':
        console.log('User joined:', data.user);
        break;
      case 'user_left':
        console.log('User left:', data.user);
        break;
      case 'error':
        console.error('Server error:', data.message);
        alert(data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  function sendCodeUpdate(code) {
    if (socket && socket.readyState === WebSocket.OPEN && isConnected) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const message = JSON.stringify({
            type: 'code_update',
            code: code,
            timestamp: Date.now()
          });
          socket.send(message);
        } catch (e) {
          socket.send(code);
        }
      }, 100);
    }
  }

  function updateConnectionStatus(status) {
    switch(status) {
      case 'connected':
        statusDot.className = 'status-dot connected';
        roomNameEl.textContent = currentRoom;
        break;
      case 'connecting':
        statusDot.className = 'status-dot';
        roomNameEl.textContent = 'Connecting...';
        break;
      case 'disconnected':
      case 'error':
        statusDot.className = 'status-dot';
        roomNameEl.textContent = 'Not Connected';
        break;
    }
  }

  function connect(roomName, password) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }

    currentRoom = roomName;
    updateConnectionStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${roomName}`;

    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      if (password) {
        socket.send(`AUTH:${password}`);
      }
      updateConnectionStatus('connected');
      isConnected = true;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        handleCodeUpdate(event.data);
      }
    };

    socket.onclose = () => {
      updateConnectionStatus('disconnected');
      currentRoom = null;
      isConnected = false;
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateConnectionStatus('error');
    };
  }

  function disconnect() {
    if (socket) {
      socket.close();
    }
  }

  function isConnectedToRoom() {
    return isConnected && socket && socket.readyState === WebSocket.OPEN;
  }

  // Return public methods
  return {
    connect,
    disconnect,
    isConnectedToRoom
  };
}