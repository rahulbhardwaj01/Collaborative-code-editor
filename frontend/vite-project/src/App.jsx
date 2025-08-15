import { useCallback, useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
const socket = io("http://localhost:3000");
import Editor from "@monaco-editor/react";
import VideoCall from "./VideoCall";
import VersionHistory from "./VersionHistory";
import FileTabs from "./components/FileTabs";
import ResizableLayout from "./components/ResizableLayout";
import ChatWindow from "./components/ChatWindow";
import { 
  detectFileType, 
  getLanguageDisplayName, 
  getPopularLanguages,
  getAllSupportedLanguages,
  isLanguageSupported 
} from "./utils/fileTypeDetection";

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  
  // File management state
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [undoRedoState, setUndoRedoState] = useState({
    canUndo: false,
    canRedo: false,
    currentVersionIndex: -1,
    totalVersions: 0,
  });
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  
  // Resizable panel states
  const [isChatDetached, setIsChatDetached] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const [codeChangeTimeout, setCodeChangeTimeout] = useState(null);

  const [theme, setTheme] = useState("dark");

  // Helper functions
  const getActiveFile = () => {
    return files.find(file => file.id === activeFileId) || null;
  };

  const getCurrentCode = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.content : '';
  };

  const getCurrentLanguage = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.language : 'javascript';
  };

  const getCurrentFilename = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.name : 'untitled.js';
  };

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  useEffect(() => {
    socket.on("userJoined", (users) => setUsers(users));
    
    // File-related events
    socket.on("roomFilesResponse", ({ files: roomFiles, activeFileId: roomActiveFileId }) => {
      setFiles(roomFiles);
      setActiveFileId(roomActiveFileId);
    });

    socket.on("fileCreated", (newFile) => {
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
    });

    socket.on("fileContentUpdated", ({ fileId, content, file }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content, lastModified: file.lastModified } : f));
    });

    socket.on("fileLanguageUpdated", ({ fileId, language, file }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, language, lastModified: file.lastModified } : f));
    });

    socket.on("fileRenamed", ({ fileId, newName, file }) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName, lastModified: file.lastModified } : f));
    });

    socket.on("fileDeleted", ({ fileId, activeFileId: newActiveFileId }) => {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setActiveFileId(newActiveFileId);
    });

    socket.on("activeFileChanged", ({ fileId, file }) => {
      setActiveFileId(fileId);
    });

    // Legacy events for backward compatibility
    socket.on("codeUpdated", (newCode) => {
      if (activeFileId) {
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
      }
    });

    socket.on("languageUpdated", (newLanguage) => {
      if (activeFileId) {
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLanguage } : f));
      }
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)} is typing...`);
      setTimeout(() => setTyping(""), 3000);
    });
    
    socket.on("chatMessage", ({ userName, message }) =>
      setChatMessages((prev) => [...prev, { userName, message }])
    );
    
    socket.on("versionAdded", (data) => setUndoRedoState(data.undoRedoState));
    
    socket.on("codeReverted", (data) => {
      // Update the active file with reverted code
      if (activeFileId) {
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: data.code, language: data.language } : f));
      }
      setUndoRedoState(data.undoRedoState);
      setIsUndoing(false);
      setIsRedoing(false);

      console.log(
        `Code ${
          data.action === "undo"
            ? "undone"
            : data.action === "redo"
            ? "redone"
            : "reverted"
        } by ${data.performer}`
      );

      const actionText =
        data.action === "undo"
          ? "undone"
          : data.action === "redo"
          ? "redone"
          : "reverted";
      console.log(`Code ${actionText} by ${data.performer}`);
    });
    socket.on("undoRedoStateResponse", (response) => {
      if (response.success) setUndoRedoState(response.undoRedoState);
    });
    socket.on("checkpointCreated", (data) => {
      setIsCreatingCheckpoint(false);
      console.log(`Checkpoint created by ${data.performer}`);
    });
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      if (error.type === "undo") setIsUndoing(false);
      if (error.type === "redo") setIsRedoing(false);
      if (error.type === "checkpoint") setIsCreatingCheckpoint(false);
    });

    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => socket.emit("leaveRoom");
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const joinRoom = () => {
    if (!roomId || !userName)
      return alert("Please enter both Room Id and Your Name");
    
    socket.emit("join_room", { roomId, userName });
    setJoined(true);

    // Request room files after joining
    setTimeout(() => {
      socket.emit("getRoomFiles", { roomId });
      socket.emit("getUndoRedoState", { roomId });
    }, 1000);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setFiles([]);
    setActiveFileId(null);
    setUsers([]);
    setTyping("");
    setShowAllLanguages(false);
    setChatMessages([]);
    setChatInput("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    });
  };

  // File management functions
  const handleCreateFile = (name) => {
    const detectedLanguage = detectFileType(name);
    const language = isLanguageSupported(detectedLanguage) ? detectedLanguage : 'javascript';
    socket.emit("createFile", { roomId, name, content: '', language });
  };

  const handleRenameFile = (fileId, newName) => {
    socket.emit("renameFile", { roomId, fileId, newName });
    
    // Auto-detect language from new filename
    const detectedLanguage = detectFileType(newName);
    if (detectedLanguage && isLanguageSupported(detectedLanguage)) {
      const file = files.find(f => f.id === fileId);
      if (file && file.language !== detectedLanguage) {
        socket.emit("fileLanguageChange", { roomId, fileId, language: detectedLanguage });
      }
    }
  };

  const handleDeleteFile = (fileId) => {
    socket.emit("deleteFile", { roomId, fileId });
  };

  const handleTabClick = (fileId) => {
    setActiveFileId(fileId);
    socket.emit("setActiveFile", { roomId, fileId });
  };

  const handleChange = (newCode) => {
    if (!activeFileId) return;
    
    // Update local state immediately for responsiveness
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));

    if (codeChangeTimeout) clearTimeout(codeChangeTimeout);

    const newTimeout = setTimeout(() => {
      socket.emit("fileContentChange", { roomId, fileId: activeFileId, content: newCode });
    }, 500);

    setCodeChangeTimeout(newTimeout);

    // typing notification
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    if (!activeFileId) return;
    
    // Update local state immediately
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLanguage } : f));
    
    socket.emit("fileLanguageChange", { roomId, fileId: activeFileId, language: newLanguage });
  };

  const handleFilenameChange = (newName) => {
    if (!activeFileId) return;
    
    handleRenameFile(activeFileId, newName);
  };

  // Legacy handlers for backward compatibility
  const handleManualLanguageChange = (e) => {
    handleLanguageChange(e);
  };

  const handleUndo = useCallback(() => {
    if (undoRedoState.canUndo && !isUndoing) {
      setIsUndoing(true);
      socket.emit("undo", { roomId });
    }
  }, [undoRedoState, isUndoing, roomId]);

  const handleRedo = useCallback(() => {
    if (undoRedoState.canRedo && !isRedoing) {
      setIsRedoing(true);
      socket.emit("redo", { roomId });
    }
  }, [undoRedoState, isRedoing, roomId]);

  const createCheckpoint = () => {
    if (!isCreatingCheckpoint) {
      setIsCreatingCheckpoint(true);
      socket.emit("createCheckpoint", { roomId, code, language });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    if (joined) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [joined, handleUndo, handleRedo]);

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMessage = { userName, message: chatInput };
    setChatMessages((prev) => [...prev, newMessage]);
    socket.emit("chatMessage", { roomId, ...newMessage });
    setChatInput("");
  };

  const handleChatDetach = (detached) => {
    setIsChatDetached(detached);
    if (!detached) {
      setIsChatMinimized(false); // Expand when bringing back
    }
  };

  const handleChatMinimize = (minimized) => {
    setIsChatMinimized(minimized);
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
    <>
      <ResizableLayout
        sidebar={
          <div className="sidebar">
            <button onClick={toggleTheme} className="theme-toggle-btn">
              {theme === "light" ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
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
            
            <div className="file-controls">
              <h3>Current File</h3>
              {files.length > 0 && getCurrentFilename() ? (
                <div className="current-file-info">
                  <div className="filename-display">
                    <strong>{getCurrentFilename()}</strong>
                  </div>
                  <div className="language-selector-group">
                    <label htmlFor="language">Language:</label>
                    <select
                      id="language"
                      className="language-selector"
                      value={getCurrentLanguage()}
                      onChange={handleManualLanguageChange}
                    >
                      <optgroup label="Popular Languages">
                        {getPopularLanguages().map((lang) => (
                          <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </optgroup>
                  {showAllLanguages && (
                    <optgroup label="All Languages">
                      {getAllSupportedLanguages()
                        .filter(lang => !getPopularLanguages().some(popular => popular.id === lang.id))
                        .map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <button 
                  type="button"
                  className="show-all-languages-btn"
                  onClick={() => setShowAllLanguages(!showAllLanguages)}
                >
                  {showAllLanguages ? "Show Less" : "Show All"}
                </button>
              </div>
              
              <div className="language-info">
                <small>
                  Current: <strong>{getLanguageDisplayName(getCurrentLanguage())}</strong>
                </small>
              </div>
            </div>
          ) : (
            <div className="loading-files">
              <p>Loading files...</p>
            </div>
          )}
        </div>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>

        <div className="version-controls">
          <h3>Version History</h3>
          <div className="version-buttons">
            <button
              className={`version-btn undo-btn ${
                !undoRedoState.canUndo || isUndoing ? "disabled" : ""
              } ${isUndoing ? "loading" : ""}`}
              onClick={handleUndo}
              disabled={!undoRedoState.canUndo || isUndoing}
              title="Undo (Ctrl+Z)"
            >
              {isUndoing ? "Undoing..." : "Undo"}
            </button>
            <button
              className={`version-btn redo-btn ${
                !undoRedoState.canRedo || isRedoing ? "disabled" : ""
              } ${isRedoing ? "loading" : ""}`}
              onClick={handleRedo}
              disabled={!undoRedoState.canRedo || isRedoing}
              title="Redo (Ctrl+Y)"
            >
              {isRedoing ? "Redoing..." : "Redo"}
            </button>

            <div className="version-controls">
              <h3>Version History</h3>
              <div className="version-buttons">
                <button
                  className={`version-btn undo-btn ${
                    !undoRedoState.canUndo || isUndoing ? "disabled" : ""
                  } ${isUndoing ? "loading" : ""}`}
                  onClick={handleUndo}
                  disabled={!undoRedoState.canUndo || isUndoing}
                  title="Undo (Ctrl+Z)"
                >
                  {isUndoing ? "Undoing..." : "Undo"}
                </button>
                <button
                  className={`version-btn redo-btn ${
                    !undoRedoState.canRedo || isRedoing ? "disabled" : ""
                  } ${isRedoing ? "loading" : ""}`}
                  onClick={handleRedo}
                  disabled={!undoRedoState.canRedo || isRedoing}
                  title="Redo (Ctrl+Y)"
                >
                  {isRedoing ? "Redoing..." : "Redo"}
                </button>
              </div>
              <div className="version-info">
                <span className="version-count">
                  {undoRedoState.currentVersionIndex + 1} /{" "}
                  {undoRedoState.totalVersions}
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
                className={`version-btn checkpoint-btn ${
                  isCreatingCheckpoint ? "loading" : ""
                }`}
                onClick={createCheckpoint}
                disabled={isCreatingCheckpoint}
                title="Create checkpoint"
              >
                {isCreatingCheckpoint ? "Creating..." : "Checkpoint"}
              </button>
            </div>
          </div>
          </div>
        }
        editor={
          <div className="editor-wrapper">
            <FileTabs
              files={files}
              activeFileId={activeFileId}
              onTabClick={handleTabClick}
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
            />
            {files.length > 0 && activeFileId ? (
              <Editor
                height={"calc(100% - 40px)"}
                defaultLanguage={getCurrentLanguage()}
                language={getCurrentLanguage()}
                value={getCurrentCode()}
                onChange={handleChange}
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            ) : (
              <div className="editor-placeholder">
                <div className="placeholder-content">
                  <h3>Welcome to the Collaborative Code Editor</h3>
                  <p>Loading files or create a new file to start coding...</p>
                </div>
              </div>
            )}
            <VideoCall
              socket={socket}
              roomId={roomId}
              userName={userName}
              joined={joined}
            />
          </div>
        }
        chatPanel={
          <div className="chat-panel-content">
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="chat-message">
                  <span className="chat-user">{msg.userName.slice(0, 8)}:</span>{" "}
                  {msg.message}
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
              <button type="submit" className="chat-send-btn">
                Send
              </button>
            </form>
          </div>
        }
        onChatDetach={handleChatDetach}
        isChatDetached={isChatDetached}
        onChatMinimize={handleChatMinimize}
        isChatMinimized={isChatMinimized}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        sendChatMessage={sendChatMessage}
        socket={socket}
        roomId={roomId}
        userName={userName}
      />
      
      {/* Detached Chat Window */}
      {isChatDetached && (
        <ChatWindow
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChatMessage={sendChatMessage}
          onClose={() => setIsChatDetached(false)}
        />
      )}

      {/* Version History Modal */}
      <VersionHistory
        socket={socket}
        roomId={roomId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
      />
    </>
  );
};

export default App;
