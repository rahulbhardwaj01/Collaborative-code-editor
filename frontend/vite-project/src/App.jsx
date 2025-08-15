import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
const socket = io("http://localhost:3000");
import Editor from "@monaco-editor/react";
import VideoCall from "./VideoCall";
import VersionHistory from "./VersionHistory";
import { 
  detectLanguageFromExtension, 
  getLanguageDisplayName, 
  getSupportedLanguages,
  isLanguageSupported,
  getDefaultCodeTemplate 
} from "./utils/fileTypeDetection";

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start coding here...");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("untitled.js");
  const [showFileInput, setShowFileInput] = useState(false);
  const [undoRedoState, setUndoRedoState] = useState({
    canUndo: false,
    canRedo: false,
    currentVersionIndex: -1,
    totalVersions: 0
  });
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  // Debounce for code changes
  const [codeChangeTimeout, setCodeChangeTimeout] = useState(null);

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });
    socket.on("codeUpdated", (newCode) => {
      setCode(newCode);
    });
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)} is typing...`);
      setTimeout(() => {
        setTyping("");
      }, 3000);
    });

    socket.on("languageUpdated", (newLanguage) => {
      setLanguage(newLanguage);
    });

    socket.on("chatMessage", ({ userName, message }) => {
      setChatMessages((prev) => [...prev, { userName, message }]);
    });

    // Version History events
    socket.on("versionAdded", (data) => {
      console.log("Version added:", data);
      setUndoRedoState(data.undoRedoState);
    });

    socket.on("codeReverted", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setUndoRedoState(data.undoRedoState);
      
      // Reset loading states
      setIsUndoing(false);
      setIsRedoing(false);
      
      // Show notification about the revert
      const actionText = data.action === 'undo' ? 'undone' : 
                        data.action === 'redo' ? 'redone' : 'reverted';
      console.log(`Code ${actionText} by ${data.performer}`);
    });

    socket.on("undoRedoStateResponse", (response) => {
      if (response.success) {
        setUndoRedoState(response.undoRedoState);
      }
    });

    socket.on("checkpointCreated", (data) => {
      setIsCreatingCheckpoint(false);
      console.log(`Checkpoint created by ${data.performer}`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      // Reset loading states on error
      if (error.type === 'undo') setIsUndoing(false);
      if (error.type === 'redo') setIsRedoing(false);
      if (error.type === 'checkpoint') setIsCreatingCheckpoint(false);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdated");
      socket.off("userTyping");
      socket.off("languageUpdated");
      socket.off("chatMessage");
      socket.off("versionAdded");
      socket.off("codeReverted");
      socket.off("undoRedoStateResponse");
      socket.off("checkpointCreated");
      socket.off("error");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join_room", { roomId, userName });
      setJoined(true);
      
      // Request initial undo/redo state after joining
      setTimeout(() => {
        socket.emit("getUndoRedoState", { roomId });
      }, 1000);
    } else {
      alert("Please enter both Room Id and Your Name");
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start coding here...");
    setUsers([]);
    setTyping("");
    setLanguage("javascript");
    setChatMessages([]);
    setChatInput("");
    setCurrentFileName("untitled.js");
    setShowFileInput(false);
  };
  const copyRoomId = () => {
    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handleChange = (newCode) => {
    setCode(newCode);
    
    // Clear existing timeout
    if (codeChangeTimeout) {
      clearTimeout(codeChangeTimeout);
    }
    
    // Debounce code change to avoid too many version saves
    const newTimeout = setTimeout(() => {
      console.log("Emitting code change for version tracking");
      socket.emit("codeChange", { roomId, code: newCode });
    }, 500); // 500ms delay
    
    setCodeChangeTimeout(newTimeout);
    
    // Immediate typing notification
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  // File name change handler with automatic language detection
  const handleFileNameChange = (filename) => {
    setCurrentFileName(filename);
    const detectedLanguage = detectLanguageFromExtension(filename);
    
    // Only change language if it's different and supported
    if (detectedLanguage !== language && isLanguageSupported(detectedLanguage)) {
      setLanguage(detectedLanguage);
      
      // Load appropriate template for new file type
      const template = getDefaultCodeTemplate(detectedLanguage, filename);
      setCode(template);
      
      socket.emit("languageChange", { roomId, language: detectedLanguage });
      socket.emit("codeChange", { roomId, code: template });
    }
    
    setShowFileInput(false);
  };

  // Manual language override (when user explicitly selects from dropdown)
  const handleManualLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  // Create new file with template
  const createNewFile = (language) => {
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'java': 'java',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'cpp': 'cpp',
      'csharp': 'cs',
      'go': 'go',
      'rust': 'rs',
      'php': 'php',
      'ruby': 'rb',
      'swift': 'swift',
      'kotlin': 'kt',
      'shell': 'sh',
      'powershell': 'ps1',
      'sql': 'sql',
      'yaml': 'yml',
      'dockerfile': 'dockerfile',
      'markdown': 'md',
      'xml': 'xml'
    };
    
    const extension = extensions[language] || 'txt';
    const filename = `untitled.${extension}`;
    const template = getDefaultCodeTemplate(language, filename);
    
    setCurrentFileName(filename);
    setLanguage(language);
    setCode(template);
    
    socket.emit("languageChange", { roomId, language });
    socket.emit("codeChange", { roomId, code: template });
  };

  // Version History functions
  const handleUndo = () => {
    console.log("Undo clicked, state:", undoRedoState);
    if (undoRedoState.canUndo && !isUndoing) {
      setIsUndoing(true);
      socket.emit("undo", { roomId });
    }
  };

  const handleRedo = () => {
    console.log("Redo clicked, state:", undoRedoState);
    if (undoRedoState.canRedo && !isRedoing) {
      setIsRedoing(true);
      socket.emit("redo", { roomId });
    }
  };

  const createCheckpoint = () => {
    if (!isCreatingCheckpoint) {
      setIsCreatingCheckpoint(true);
      socket.emit("createCheckpoint", { roomId, code, language });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    if (joined) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [joined, undoRedoState]);

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit("chatMessage", { roomId, userName, message: chatInput });
      setChatInput("");
    }
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId}> Copy Id</button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        
        {/* File Management Section */}
        <div className="file-management">
          <h3>File</h3>
          <div className="file-info">
            <div className="current-file">
              <span className="file-label">Current file:</span>
              <span className="file-name" onClick={() => setShowFileInput(true)} title="Click to change filename">
                {currentFileName}
              </span>
            </div>
            {showFileInput && (
              <div className="file-input-container">
                <input
                  type="text"
                  placeholder="Enter filename (e.g., script.py, index.html)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFileNameChange(e.target.value || 'untitled.txt');
                    } else if (e.key === 'Escape') {
                      setShowFileInput(false);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      handleFileNameChange(e.target.value);
                    } else {
                      setShowFileInput(false);
                    }
                  }}
                  autoFocus
                  className="file-input"
                />
                <small className="file-input-hint">Press Enter to save, Esc to cancel</small>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="language-section">
          <h3>Language</h3>
          <div className="language-info">
            <div className="detected-language">
              <span className="language-label">Detected:</span>
              <span className="language-value">{getLanguageDisplayName(language)}</span>
            </div>
            <select
              className="language-selector"
              value={language}
              onChange={handleManualLanguageChange}
              title="Override detected language"
            >
              {getSupportedLanguages().map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>

        {/* Version History Controls */}
        <div className="version-controls">
          <h3>Version History</h3>
          <div className="version-buttons">
            <button 
              className={`version-btn undo-btn ${(!undoRedoState.canUndo || isUndoing) ? 'disabled' : ''} ${isUndoing ? 'loading' : ''}`}
              onClick={handleUndo}
              disabled={!undoRedoState.canUndo || isUndoing}
              title="Undo (Ctrl+Z)"
            >
              {isUndoing ? 'Undoing...' : 'Undo'}
            </button>
            <button 
              className={`version-btn redo-btn ${(!undoRedoState.canRedo || isRedoing) ? 'disabled' : ''} ${isRedoing ? 'loading' : ''}`}
              onClick={handleRedo}
              disabled={!undoRedoState.canRedo || isRedoing}
              title="Redo (Ctrl+Y)"
            >
              {isRedoing ? 'Redoing...' : 'Redo'}
            </button>
          </div>
          <div className="version-info">
            <span className="version-count">
              {undoRedoState.currentVersionIndex + 1} / {undoRedoState.totalVersions}
            </span>
          </div>
          <button 
            className="version-btn history-btn"
            onClick={() => setShowVersionHistory(true)}
            title="View version history"
          >
            History
          </button>
          <button 
            className={`version-btn checkpoint-btn ${isCreatingCheckpoint ? 'loading' : ''}`}
            onClick={createCheckpoint}
            disabled={isCreatingCheckpoint}
            title="Create checkpoint"
          >
            {isCreatingCheckpoint ? 'Creating...' : 'Checkpoint'}
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height={"100%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
        <VideoCall socket={socket} roomId={roomId} userName={userName} joined={joined} />
      </div>

      <div className="chat-panel">
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="chat-user">{msg.userName.slice(0, 8)}:</span> {msg.message}
            </div>
          ))}
        </div>
        <form className="chat-input-form" onSubmit={sendChatMessage}>
          <input
            className="chat-input"
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={200}
          />
          <button type="submit" className="chat-send-btn">Send</button>
        </form>
      </div>

      {/* Version History Modal */}
      <VersionHistory 
        socket={socket}
        roomId={roomId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
      />
    </div>
  );
};

export default App;
