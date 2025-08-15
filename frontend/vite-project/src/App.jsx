import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
const socket = io("http://localhost:3000");
import Editor from "@monaco-editor/react";
import VideoCall from "./VideoCall";
import VersionHistory from "./VersionHistory";
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

    socket.on("versionAdded", (data) => {
      console.log("Version added:", data);
      setUndoRedoState(data.undoRedoState);
    });

    socket.on("codeReverted", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setUndoRedoState(data.undoRedoState);
      setIsUndoing(false);
      setIsRedoing(false);
      const actionText =
        data.action === "undo"
          ? "undone"
          : data.action === "redo"
          ? "redone"
          : "reverted";
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
      if (error.type === "undo") setIsUndoing(false);
      if (error.type === "redo") setIsRedoing(false);
      if (error.type === "checkpoint") setIsCreatingCheckpoint(false);
    });

    // cleanup
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
    const handleBeforeUnload = () => {
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

    if (codeChangeTimeout) {
      clearTimeout(codeChangeTimeout);
    }

    const newTimeout = setTimeout(() => {
      socket.emit("codeChange", { roomId, code: newCode });
    }, 500);

    setCodeChangeTimeout(newTimeout);

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

  const handleUndo = () => {
    if (undoRedoState.canUndo && !isUndoing) {
      setIsUndoing(true);
      socket.emit("undo", { roomId });
    }
  };

  const handleRedo = () => {
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
  }, [joined, undoRedoState]);

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const newMessage = { userName, message: chatInput };
      setChatMessages((prev) => [...prev, newMessage]);
      socket.emit("chatMessage", { roomId, ...newMessage });
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
            fontSize: 14
          }}
        />
        <VideoCall
          socket={socket}
          roomId={roomId}
          userName={userName}
          joined={joined}
        />
      </div>

      <div className="chat-panel">
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
