import { useCallback, useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
const socket = io("http://localhost:3000");
import Editor from "@monaco-editor/react";
import VideoCall from "./VideoCall";
import VersionHistory from "./VersionHistory";
import ResizableLayout from "./components/ResizableLayout";
import ChatWindow from "./components/ChatWindow";
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
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Welcome to the collaborative code editor\n// Start coding here...");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [filename, setFilename] = useState("untitled.js");
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
    socket.on("codeUpdated", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)} is typing...`);
      setTimeout(() => setTyping(""), 3000);
    });
    socket.on("languageUpdated", (newLanguage) => setLanguage(newLanguage));
    socket.on("chatMessage", ({ userName, message }) =>
      setChatMessages((prev) => [...prev, { userName, message }])
    );
    socket.on("versionAdded", (data) => setUndoRedoState(data.undoRedoState));
    socket.on("codeReverted", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setUndoRedoState(data.undoRedoState);
      setIsUndoing(false);
      setIsRedoing(false);

      console.log(
        `Code ${data.action === "undo"
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

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Welcome to the collaborative code editor\n// Start coding here...");
    setUsers([]);
    setTyping("");
    setLanguage("javascript");
    setFilename("untitled.js");
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
    setCode(newCode);

    if (codeChangeTimeout) clearTimeout(codeChangeTimeout);

    if (codeChangeTimeout) {
      clearTimeout(codeChangeTimeout);
    }

    const newTimeout = setTimeout(() => {
      socket.emit("codeChange", { roomId, code: newCode });
    }, 500);

    setCodeChangeTimeout(newTimeout);

    // typing notification
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const handleFilenameChange = (e) => {
    const newFilename = e.target.value;
    setFilename(newFilename);

    // Auto-detect language from filename
    const detectedLanguage = detectFileType(newFilename);
    if (detectedLanguage && detectedLanguage !== language && isLanguageSupported(detectedLanguage)) {
      setLanguage(detectedLanguage);
      socket.emit("languageChange", { roomId, language: detectedLanguage });
    }
  };

  const handleManualLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });

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

                <div className="file-controls">
                  <h3>File & Language</h3>
                  <div className="filename-input-group">
                    <label htmlFor="filename">Filename:</label>
                    <input
                      id="filename"
                      type="text"
                      className="filename-input"
                      value={filename}
                      onChange={handleFilenameChange}
                      placeholder="e.g., main.js, script.py"
                    />
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
                      className={`version-btn undo-btn ${!undoRedoState.canUndo || isUndoing ? "disabled" : ""
                        } ${isUndoing ? "loading" : ""}`}
                      onClick={handleUndo}
                      disabled={!undoRedoState.canUndo || isUndoing}
                      title="Undo (Ctrl+Z)"
                    >
                      {isUndoing ? "Undoing..." : "Undo"}
                    </button>
                    <button
                      className={`version-btn redo-btn ${!undoRedoState.canRedo || isRedoing ? "disabled" : ""
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
                    className={`version-btn checkpoint-btn ${isCreatingCheckpoint ? "loading" : ""
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
                <Editor
                  height={"100%"}
                  defaultLanguage={language}
                  language={language}
                  value={code}
                  onChange={handleChange}
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
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