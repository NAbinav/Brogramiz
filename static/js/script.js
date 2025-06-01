      // === UTILS: Dynamic Script and CSS Loader ===
      function loadScript(src) {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve();
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }

      function loadCSS(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }

      // === Load CodeMirror core + selected language mode ===
      async function loadCodeMirror(language) {
        const baseURL = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13";

        const langMap = {
          cpp: "clike",
          c: "clike",
          python: "python",
          java: "clike",
          html: "htmlmixed",
          go: "go",
        };

        const modeMap = {
          cpp: "text/x-c++src",
          c: "text/x-csrc",
          python: "text/x-python",
          java: "text/x-java",
          html: "htmlmixed",
          go: "text/x-go",
        };

        const mode = langMap[language] || "clike";
        await loadScript(`${baseURL}/mode/${mode}/${mode}.min.js`);

        return modeMap[language] || "text/x-c++src";
      }

      // === Globals ===
      let editor;
      let socket;
      let debounceTimer;
      let currentRoom = null;

      // === Init Editor ===
      async function initEditor(language) {
        const mode = await loadCodeMirror(language);
        editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
          mode,
          theme: "monokai",
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
        });
        editor.setSize("100%", "100%");

        attachAISuggestions();
      }

      // === Form Submission (Fetch) ===
      document.getElementById("code-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const code = editor.getValue();
        const input = document.querySelector('textarea[name="input_content"]').value;
        const language = document.getElementById("language").value;

        // Update output with loading state
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
            
            // Extract the output from the returned HTML template
            const outputElement = doc.querySelector(".output");
            if (outputElement) {
              // Get the inner content and display it properly
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

      // === Dynamic Language Change ===
      document.getElementById("language").addEventListener("change", async function () {
        const mode = await loadCodeMirror(this.value);
        editor.setOption("mode", mode);
      });

      // === Room Modal Functions ===
      function openRoomModal() {
        document.getElementById("roomModal").classList.add("show");
      }

      function closeRoomModal() {
        document.getElementById("roomModal").classList.remove("show");
      }

      function joinRoom() {
        const roomName = document.getElementById("roomNameInput").value.trim();
        const password = document.getElementById("roomPasswordInput").value;
        
        if (!roomName) {
          alert("Please enter a room name");
          return;
        }

        attachWebSocket(roomName, password);
        closeRoomModal();
      }

      // === WebSocket Collaboration ===
      function attachWebSocket(roomName, password) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }

        currentRoom = roomName;
        updateConnectionStatus("connecting");

        socket = new WebSocket(`ws://${location.host}/ws/${roomName}`);
        
        socket.onopen = () => {
          console.log("Connected to room:", roomName);
          socket.send(`AUTH:${password}`);
          updateConnectionStatus("connected");
        };

        socket.onmessage = (event) => {
          const remoteCode = event.data;
          if (remoteCode !== editor.getValue()) {
            const cursor = editor.getCursor();
            editor.setValue(remoteCode);
            editor.setCursor(cursor);
          }
        };

        socket.onclose = () => {
          console.log("Disconnected from room.");
          updateConnectionStatus("disconnected");
          currentRoom = null;
        };

        socket.onerror = () => {
          updateConnectionStatus("error");
        };

        editor.on("change", () => {
          if (socket.readyState === WebSocket.OPEN) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              socket.send(editor.getValue());
            }, 1);
          }
        });
      }

      function updateConnectionStatus(status) {
        const statusDot = document.getElementById("connectionStatus");
        const roomNameEl = document.getElementById("roomName");
        
        switch(status) {
          case "connected":
            statusDot.className = "status-dot connected";
            roomNameEl.textContent = currentRoom;
            break;
          case "connecting":
            statusDot.className = "status-dot";
            roomNameEl.textContent = "Connecting...";
            break;
          case "disconnected":
          case "error":
            statusDot.className = "status-dot";
            roomNameEl.textContent = "Not Connected";
            break;
        }
      }

      // === AI Suggestions (Shortcuts) ===
      function attachAISuggestions() {
        document.addEventListener("keydown", async function (e) {
          const code = editor.getValue();
          const language = document.getElementById("language").value;

          if (e.ctrlKey && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            try {
              const response = await fetch("/line_ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language })
              });

              if (response.ok) {
                let data = await response.text();
                data = data.trim().split("\n").slice(1, -1).join("\n");
                const doc = editor.getDoc();
                const cursor = doc.getCursor();
                doc.replaceRange(data, cursor);
              } else {
                alert("Error getting suggestion from AI.");
              }
            } catch (error) {
              alert("Network error occurred while getting AI suggestion.");
            }
          }

          if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
            e.preventDefault();
            try {
              const response = await fetch("/full_ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language })
              });

              if (response.ok) {
                let data = await response.text();
                data = data.trim().split("\n").slice(1, -1).join("\n");
                editor.setValue(data);
              } else {
                alert("Error getting full suggestion from AI.");
              }
            } catch (error) {
              alert("Network error occurred while getting AI suggestion.");
            }
          }
        });
      }

      // === Start Editor on Page Load ===
      window.addEventListener("DOMContentLoaded", () => {
        const defaultLang = document.getElementById("language").value || "cpp";
        initEditor(defaultLang);
      });

      // Close modal when clicking outside
      document.getElementById("roomModal").addEventListener("click", function(e) {
        if (e.target === this) {
          closeRoomModal();
        }
      });

