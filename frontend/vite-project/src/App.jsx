import { useCallback, useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
const socket = io("http://localhost:3000");
import Editor from "@monaco-editor/react";
import VideoCall from "./VideoCall";
import VersionHistory from "./VersionHistory";
import ResizableLayout from "./components/ResizableLayout";
import ChatWindow from "./components/ChatWindow";
import FileExplorer from "./components/FileExplorer";
import LandingPage from "./pages/Landing_page";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
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
  const [activeFile, setActiveFile] = useState("");
  const [currentFileContent, setCurrentFileContent] = useState("");
  const [currentFileLanguage, setCurrentFileLanguage] = useState("javascript");
  
  // Legacy state for backward compatibility
  const [language, setLanguage] = useState("javascript");
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

  const placeholderText = '  Start typing here...';

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
    // User and room events
    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdated", (newCode) => {
      setCode(newCode);
      setCurrentFileContent(newCode);
    });
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)} is typing...`);
      setTimeout(() => setTyping(""), 3000);
    });
    socket.on("languageUpdated", (newLanguage) => {
      setLanguage(newLanguage);
      setCurrentFileLanguage(newLanguage);
    });
    socket.on("chatMessage", ({ userName, message }) =>
      setChatMessages((prev) => [...prev, { userName, message }])
    );
    
    // File management events
    socket.on("filesUpdated", ({ files: newFiles, activeFile: newActiveFile }) => {
      setFiles(newFiles);
      setActiveFile(newActiveFile);
      
      // Update current file content and language
      const currentFile = newFiles.find(f => f.filename === newActiveFile);
      if (currentFile) {
        setCurrentFileContent(currentFile.code);
        setCurrentFileLanguage(currentFile.language);
        setCode(currentFile.code);
        setLanguage(currentFile.language);
        setFilename(currentFile.filename);
      }
    });

    socket.on("fileCreated", ({ file, createdBy }) => {
      setFiles(prev => [...prev, file]);
      setChatMessages((prev) => [...prev, { 
        userName: "System", 
        message: `File "${file.filename}" created by ${createdBy}` 
      }]);
    });

    socket.on("fileDeleted", ({ filename, deletedBy, newActiveFile }) => {
      setFiles(prev => prev.filter(f => f.filename !== filename));
      
      if (newActiveFile && newActiveFile !== activeFile) {
        setActiveFile(newActiveFile);
        // Request file content update
        socket.emit("switchFile", { roomId, filename: newActiveFile, switchedBy: userName });
      }
      
      setChatMessages((prev) => [...prev, { 
        userName: "System", 
        message: `File "${filename}" deleted by ${deletedBy}` 
      }]);
    });

    socket.on("fileRenamed", ({ oldFilename, newFilename, renamedBy }) => {
      setFiles(prev => prev.map(f => 
        f.filename === oldFilename 
          ? { ...f, filename: newFilename }
          : f
      ));
      
      if (activeFile === oldFilename) {
        setActiveFile(newFilename);
        setFilename(newFilename);
      }
      
      setChatMessages((prev) => [...prev, { 
        userName: "System", 
        message: `File renamed from "${oldFilename}" to "${newFilename}" by ${renamedBy}` 
      }]);
    });

    socket.on("activeFileChanged", ({ filename, file, switchedBy }) => {
      setActiveFile(filename);
      setCurrentFileContent(file.code);
      setCurrentFileLanguage(file.language);
      setCode(file.code);
      setLanguage(file.language);
      setFilename(filename);
      
      // Update files state to reflect active status
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        isActive: f.filename === filename 
      })));
    });

    socket.on("fileCodeUpdated", ({ filename, code: newCode }) => {
      if (filename === activeFile) {
        setCurrentFileContent(newCode);
        setCode(newCode);
      }
      
      // Update the file in files array
      setFiles(prev => prev.map(f => 
        f.filename === filename 
          ? { ...f, code: newCode }
          : f
      ));
    });

    socket.on("fileLanguageUpdated", ({ filename, language: newLanguage }) => {
      if (filename === activeFile) {
        setCurrentFileLanguage(newLanguage);
        setLanguage(newLanguage);
      }
      
      // Update the file in files array
      setFiles(prev => prev.map(f => 
        f.filename === filename 
          ? { ...f, language: newLanguage }
          : f
      ));
    });

    // Version history events
    socket.on("versionAdded", (data) => setUndoRedoState(data.undoRedoState));
    socket.on("codeReverted", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setCurrentFileContent(data.code);
      setCurrentFileLanguage(data.language);
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
      if (error.type === "createFile") alert(`Error creating file: ${error.message}`);
      if (error.type === "deleteFile") alert(`Error deleting file: ${error.message}`);
      if (error.type === "renameFile") alert(`Error renaming file: ${error.message}`);
      if (error.type === "switchFile") alert(`Error switching file: ${error.message}`);
    });
    
    // Legacy filename change event for backward compatibility
    socket.on("filenameChanged", ({ oldFilename, newFilename, userName: changedBy }) => {
      setFilename(newFilename);
      setChatMessages((prev) => [
        ...prev,
        { userName: "System", message: `Filename changed from "${oldFilename}" to "${newFilename}" by ${changedBy}` }
      ]);
    });

    return () => {
      socket.off();
    };
  }, [roomId, userName, activeFile]);

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

    setTimeout(() => {
      socket.emit("getUndoRedoState", { roomId });
    }, 1000);

    if (roomId && userName) {
      socket.emit("join_room", { roomId, userName });
      setJoined(true);

      setTimeout(() => {
        socket.emit("getUndoRedoState", { roomId });
      }, 1000);
    } else {
      alert("Please enter both Room Id and Your Name");
    }
  };

  // File management functions
  const handleFileCreate = (filename, createdBy, code = '', language = 'javascript') => {
    socket.emit("createFile", { 
      roomId, 
      filename, 
      createdBy, 
      code, 
      language 
    });
  };

  const handleFileDelete = (filename, deletedBy) => {
    socket.emit("deleteFile", { 
      roomId, 
      filename, 
      deletedBy 
    });
  };

  const handleFileRename = (oldFilename, newFilename) => {
    if (!newFilename || newFilename === oldFilename) return;
    
    socket.emit("renameFile", { 
      roomId, 
      oldFilename, 
      newFilename, 
      renamedBy: userName 
    });
  };

  const handleFileSwitch = (filename, switchedBy) => {
    if (filename === activeFile) return;
    
    socket.emit("switchFile", { 
      roomId, 
      filename, 
      switchedBy 
    });
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Welcome to the collaborative code editor\n// Start coding here...");
    setCurrentFileContent("// Welcome to the collaborative code editor\n// Start coding here...");
    setUsers([]);
    setTyping("");
    setLanguage("javascript");
    setCurrentFileLanguage("javascript");
    setFilename("untitled.js");
    setActiveFile("");
    setFiles([]);
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

  const handleChange = (newCode) => {
    const placeholderEl = document.querySelector('.monaco-placeholder');

    // use newCode instead of undefined "value"
    if (!newCode) {
      if (placeholderEl) placeholderEl.style.display = 'block';
    } else {
      if (placeholderEl) placeholderEl.style.display = 'none';
    }

    setCode(newCode);
    setCurrentFileContent(newCode);

    // clear existing timeout if any
    if (codeChangeTimeout) {
      window.clearTimeout(codeChangeTimeout);
    }

    const newTimeout = window.setTimeout(() => {
      // Use new file-specific code change event if active file exists
      if (activeFile) {
        socket.emit('fileCodeChange', { roomId, filename: activeFile, code: newCode });
      } else {
        // Fallback to legacy method
        socket.emit('codeChange', { roomId, code: newCode });
      }
    }, 500);

    setCodeChangeTimeout(newTimeout);

    // typing notification
    socket.emit('typing', { roomId, userName });
  };


  // Legacy filename change functions for backward compatibility
  const handleFilenameChange = (e) => {
    setPendingFilename(e.target.value);
  };

  const saveFilenameChange = () => {
    if (!pendingFilename || pendingFilename === filename) return;
    
    if (activeFile) {
      // Use new file rename functionality
      handleFileRename(activeFile, pendingFilename);
    } else {
      // Fallback to legacy method
      const oldFilename = filename;
      setFilename(pendingFilename);
      // Auto-detect language from filename
      const detectedLanguage = detectFileType(pendingFilename);
      if (detectedLanguage && detectedLanguage !== language && isLanguageSupported(detectedLanguage)) {
        setLanguage(detectedLanguage);
        setCurrentFileLanguage(detectedLanguage);
        socket.emit("languageChange", { roomId, language: detectedLanguage });
      }
      socket.emit("filenameChange", { roomId, oldFilename, newFilename: pendingFilename, userName });
    }
    setPendingFilename("");
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCurrentFileLanguage(newLanguage);
    
    // Use new file-specific language change event if active file exists
    if (activeFile) {
      socket.emit("fileLanguageChange", { roomId, filename: activeFile, language: newLanguage });
    } else {
      // Fallback to legacy method
      socket.emit("languageChange", { roomId, language: newLanguage });
    }
  };

  const handleManualLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCurrentFileLanguage(newLanguage);
    
    // Use new file-specific language change event if active file exists
    if (activeFile) {
      socket.emit("fileLanguageChange", { roomId, filename: activeFile, language: newLanguage });
    } else {
      // Fallback to legacy method
      socket.emit("languageChange", { roomId, language: newLanguage });
    }
    
    // Don't update filename automatically to avoid conflicts
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

   const handleJoinFromLanding = (newRoomId, newUserName) => {
    setRoomId(newRoomId);
    setUserName(newUserName);
    socket.emit("join_room", { roomId: newRoomId, userName: newUserName });
    setJoined(true);

    // Request initial undo/redo state after joining
    setTimeout(() => {
      socket.emit("getUndoRedoState", { roomId: newRoomId });
    }, 1000);
  };

  if (!joined) {
    return <LandingPage onJoinRoom={handleJoinFromLanding} />;
  }

    return (
          <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
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
            
            {/* File Explorer Component */}
            <FileExplorer
              files={files}
              activeFile={activeFile}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              onFileRename={handleFileRename}
              onFileSwitch={handleFileSwitch}
              userName={userName}
            />
            
            <div className="file-controls">
              <h3>Current File Settings</h3>
              <div className="filename-input-group">
                <label htmlFor="filename">Active File:</label>
                <input
                  id="filename"
                  type="text"
                  className="filename-input"
                  value={pendingFilename || filename}
                  onChange={handleFilenameChange}
                  placeholder="e.g., main.js, script.py"
                />
                <button onClick={saveFilenameChange} className="save-filename-btn">Rename</button>
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
            <div className="editor-header">
              <span className="current-file-indicator">
                📄 {activeFile || filename} 
                {activeFile && (
                  <span className="file-language-badge">
                    {getLanguageDisplayName(currentFileLanguage)}
                  </span>
                )}
              </span>
            </div>
            <Editor
              height={"calc(100% - 40px)"}
              defaultLanguage={currentFileLanguage}
              language={currentFileLanguage}
              value={currentFileContent || code}
              onChange={handleChange}
              onMount={handleEditorOnMount}
              theme={theme === "dark" ? "vs-dark" : "vs-light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
            <div className={`monaco-placeholder ${theme === 'dark' ? 'placeholder-dark' : 'placeholder-light'}`}>{placeholderText}</div>
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
          </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
