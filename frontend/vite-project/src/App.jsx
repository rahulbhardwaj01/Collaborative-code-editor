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
import LandingPage from "./components/LandingPage";
import { 
  detectFileType, 
  getLanguageDisplayName, 
  getPopularLanguages,
  getAllSupportedLanguages,
  isLanguageSupported 
} from "./utils/fileTypeDetection";

const App = () => {
  // Initialize state from localStorage if available (our localStorage feature)
  const [joined, setJoined] = useState(() => {
    const savedJoined = localStorage.getItem('codeEditor_joined');
    return savedJoined === 'true';
  });
  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem('codeEditor_roomId') || "";
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('codeEditor_userName') || "";
  });
  
  // File management state (new multi-file support from main)
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  
  // Legacy state for backward compatibility
  const [language, setLanguage] = useState("js");
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("untitled.js");
  const [pendingFilename, setPendingFilename] = useState("");
  
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

  // Helper functions for multi-file support
  const getActiveFile = () => {
    return files.find(file => file.id === activeFileId) || null;
  };

  const getCurrentCode = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.content : code; // fallback to legacy code
  };

  const getCurrentLanguage = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.language : language; // fallback to legacy language
  };

  const getCurrentFilename = () => {
    const activeFile = getActiveFile();
    return activeFile ? activeFile.name : filename; // fallback to legacy filename
  };

  // Legacy placeholder text for Monaco editor
  const placeholderText = '  Start typing here...';

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
    }
  }, []);

  // Auto-rejoin room on page reload if user was previously in a room
  useEffect(() => {
    if (joined && roomId && userName) {
      // Rejoin the room after a short delay to ensure socket connection is ready
      const rejoinTimer = setTimeout(() => {
        socket.emit("join_room", { roomId, userName });
        socket.emit("getUndoRedoState", { roomId });
      }, 1000);
      
      return () => clearTimeout(rejoinTimer);
    }
  }, [joined, roomId, userName]);

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
    socket.on("filenameChanged", ({ oldFilename, newFilename, userName }) => {
      setFilename(newFilename);
      setChatMessages((prev) => [
        ...prev,
        { userName: "System", message: `Filename changed from \"${oldFilename}\" to \"${newFilename}\" by ${userName}` }
      ]);
    });

    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
      // Only clear localStorage if user explicitly closes the tab/browser
      // Don't clear on page refresh
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const joinRoom = (roomIdParam, userNameParam) => {
    const finalRoomId = roomIdParam || roomId;
    const finalUserName = userNameParam || userName;
    
    if (!finalRoomId || !finalUserName)
      return alert("Please enter both Room Id and Your Name");
    
    // Save to localStorage (our feature)
    localStorage.setItem('codeEditor_roomId', finalRoomId);
    localStorage.setItem('codeEditor_userName', finalUserName);
    localStorage.setItem('codeEditor_joined', 'true');
    
    setRoomId(finalRoomId);
    setUserName(finalUserName);
    socket.emit("join_room", { roomId: finalRoomId, userName: finalUserName });
    setJoined(true);

    // Request room files after joining (from main branch)
    setTimeout(() => {
      socket.emit("getRoomFiles", { roomId: finalRoomId });
      socket.emit("getUndoRedoState", { roomId: finalRoomId });
    }, 1000);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    
    // Clear localStorage
    localStorage.removeItem('codeEditor_roomId');
    localStorage.removeItem('codeEditor_userName');
    localStorage.removeItem('codeEditor_joined');
    
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
    // Handle placeholder visibility for Monaco editor
    const placeholderEl = document.querySelector('.monaco-placeholder');
    if (!newCode) {
      if (placeholderEl) placeholderEl.style.display = 'block';
    } else {
      if (placeholderEl) placeholderEl.style.display = 'none';
    }

    // Update state based on whether we're in multi-file mode or legacy mode
    if (activeFileId && files.length > 0) {
      // Multi-file mode: update the active file
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newCode } : f));
    } else {
      // Legacy mode: update the code state
      setCode(newCode);
    }

    // Clear existing timeout if any
    if (codeChangeTimeout) {
      clearTimeout(codeChangeTimeout);
    }

    const newTimeout = setTimeout(() => {
      if (activeFileId && files.length > 0) {
        // Multi-file mode: emit file content change
        socket.emit("fileContentChange", { roomId, fileId: activeFileId, content: newCode });
      } else {
        // Legacy mode: emit code change
        socket.emit('codeChange', { roomId, code: newCode });
      }
    }, 500);

    setCodeChangeTimeout(newTimeout);

    // typing notification
    socket.emit('typing', { roomId, userName });
  };


  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    
    if (activeFileId && files.length > 0) {
      // Multi-file mode: update the active file language
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLanguage } : f));
      socket.emit("fileLanguageChange", { roomId, fileId: activeFileId, language: newLanguage });
    } else {
      // Legacy mode: update language state
      setLanguage(newLanguage);
      socket.emit("languageChange", { roomId, language: newLanguage });
    }
  };

  // Legacy filename handling functions
  const handleFilenameChange = (e) => {
    setPendingFilename(e.target.value);
  };

  const saveFilenameChange = () => {
    if (!pendingFilename || pendingFilename === filename) return;
    const oldFilename = filename;
    setFilename(pendingFilename);
    // Auto-detect language from filename
    const detectedLanguage = detectFileType(pendingFilename);
    if (detectedLanguage && detectedLanguage !== language && isLanguageSupported(detectedLanguage)) {
      setLanguage(detectedLanguage);
      socket.emit("languageChange", { roomId, language: detectedLanguage });
    }
    socket.emit("filenameChange", { roomId, oldFilename, newFilename: pendingFilename, userName });
    setPendingFilename("");
  };

  // Multi-file filename handling
  const handleFileRename = (newName) => {
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

  const handleEditorOnMount = (editor, monaco) => {
    const placeholderEl = document.querySelector('.monaco-placeholder');
    placeholderEl.style.display = 'block';
    editor.focus();
  };

  if (!joined) {
    return <LandingPage onJoinRoom={joinRoom} />;
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
              <h3>{files.length > 0 ? 'Current File' : 'File & Language'}</h3>
              
              {/* Multi-file mode: Show current file info */}
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
                /* Legacy mode: Show filename input and language selector */
                <>
                  <div className="filename-input-group">
                    <label htmlFor="filename">Filename:</label>
                    <input
                      id="filename"
                      type="text"
                      className="filename-input"
                      value={pendingFilename || filename}
                      onChange={handleFilenameChange}
                      placeholder="e.g., main.js, script.py"
                    />
                    <button onClick={saveFilenameChange} className="save-filename-btn">Save Filename</button>
                  </div>
                  
                  <div className="language-selector-group">
                    <label htmlFor="language">Language:</label>
                    <select
                      id="language"
                      className="language-selector"
                      value={language}
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
                      Current: <strong>{getLanguageDisplayName(language)}</strong>
                    </small>
                  </div>
                </>
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
        }
        editor={
          <div className="editor-wrapper">
            {/* Show FileTabs only if we have files in multi-file mode */}
            {files.length > 0 && (
              <FileTabs
                files={files}
                activeFileId={activeFileId}
                onTabClick={handleTabClick}
                onCreateFile={handleCreateFile}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
              />
            )}
            
            {/* Editor component */}
            {files.length > 0 && activeFileId ? (
              /* Multi-file mode */
              <Editor
                height={files.length > 0 ? "calc(100% - 40px)" : "100%"}
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
            ) : files.length === 0 ? (
              /* Legacy mode */
              <>
                <Editor
                  height={"100%"}
                  defaultLanguage={language}
                  language={language}
                  value={code}
                  onChange={handleChange}
                  onMount={handleEditorOnMount}
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
                <div className={`monaco-placeholder ${theme === 'dark' ? 'placeholder-dark' : 'placeholder-light'}`}>{placeholderText}</div>
              </>
            ) : (
              /* Loading state */
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
