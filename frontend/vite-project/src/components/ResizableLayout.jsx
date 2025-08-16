import React, { useState, useRef, useEffect } from 'react';
import './ResizableLayout.css';

const ResizableLayout = ({ 
  sidebar, 
  editor, 
  chatPanel, 
  onChatDetach,
  onChatMinimize,
  isChatDetached,
  isChatMinimized,
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
  socket,
  roomId,
  userName,
  chatPosition = { x: 100, y: 100 }
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(300);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [floatingChatPosition, setFloatingChatPosition] = useState(chatPosition);
  const [isFloating, setIsFloating] = useState(false);
  const [detachedChatWindow, setDetachedChatWindow] = useState(null);

  const containerRef = useRef(null);
  const sidebarResizeRef = useRef(null);
  const chatResizeRef = useRef(null);
  const floatingChatRef = useRef(null);

  // Sidebar resize functionality
  const handleSidebarMouseDown = (e) => {
    setIsResizingSidebar(true);
    e.preventDefault();
  };

  // Chat resize functionality
  const handleChatMouseDown = (e) => {
    if (!isFloating) {
      setIsResizingChat(true);
      e.preventDefault();
    }
  };

  // Chat drag functionality
  const handleChatDragStart = (e) => {
    if (isFloating) {
      setIsDraggingChat(true);
      const rect = floatingChatRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
      }
      
      if (isResizingChat && !isFloating) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(250, Math.min(500, containerRect.right - e.clientX));
        setChatWidth(newWidth);
      }

      if (isDraggingChat && isFloating) {
        setFloatingChatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingChat(false);
      setIsDraggingChat(false);
    };

    if (isResizingSidebar || isResizingChat || isDraggingChat) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingSidebar, isResizingChat, isDraggingChat, dragOffset, isFloating]);

  // Update detached chat window when messages change
  useEffect(() => {
    if (detachedChatWindow && !detachedChatWindow.closed) {
      renderChatInNewWindow(detachedChatWindow);
    }
  }, [chatMessages, chatInput]);

  // Cleanup detached window on unmount
  useEffect(() => {
    return () => {
      if (detachedChatWindow && !detachedChatWindow.closed) {
        detachedChatWindow.close();
      }
    };
  }, [detachedChatWindow]);

  const toggleChatMinimize = () => {
    onChatMinimize(!isChatMinimized);
  };

  const detachChat = () => {
    onChatDetach(!isChatDetached);
  };

  const attachChat = () => {
    onChatDetach(false);
  };

  const openChatInNewWindow = () => {
    // Open new window for chat
    const newWindow = window.open(
      '',
      'ChatWindow',
      'width=450,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
    );

    if (newWindow) {
      // Store the window reference
      setDetachedChatWindow(newWindow);
      
      // Handle window close
      newWindow.addEventListener('beforeunload', () => {
        setDetachedChatWindow(null);
      });
      // Set up the new window content
      newWindow.document.title = 'Collaborative Code Editor - Chat';
      newWindow.document.head.innerHTML = `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat Window</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "Outfit", sans-serif;
          }
          
          body {
            background-color: #161719;
            color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .detached-chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 1rem;
          }
          
          .detached-chat-header {
            background-color: #6725d9;
            color: white;
            padding: 1rem;
            margin: -1rem -1rem 1rem -1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .detached-chat-title {
            font-weight: 600;
            font-size: 1.1rem;
          }
          
          .detached-close-btn {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .detached-close-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .detached-chat-messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 1rem;
            padding: 0.5rem;
            background-color: #191a1b;
            border-radius: 8px;
            border: 1px solid #333;
          }
          
          .detached-chat-message {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: #2c3e50;
            border-radius: 4px;
            word-break: break-word;
          }
          
          .detached-chat-user {
            font-weight: bold;
            color: #7ed6df;
            margin-right: 0.5rem;
          }
          
          .detached-chat-input-form {
            display: flex;
            gap: 0.5rem;
          }
          
          .detached-chat-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #333;
            border-radius: 4px;
            background-color: #191a1b;
            color: white;
            font-size: 0.9rem;
          }
          
          .detached-chat-input:focus {
            outline: none;
            border-color: #6725d9;
          }
          
          .detached-chat-send-btn {
            background-color: #6725d9;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.3s ease;
          }
          
          .detached-chat-send-btn:hover {
            background-color: #793be4;
          }
          
          .detached-chat-empty {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 2rem;
          }
        </style>
      `;

      // Initial render of chat content
      renderChatInNewWindow(newWindow);
    }
  };

  const renderChatInNewWindow = (targetWindow) => {
    if (!targetWindow || targetWindow.closed) return;
    
    targetWindow.document.body.innerHTML = `
      <div class="detached-chat-container">
        <div class="detached-chat-header">
          <div class="detached-chat-title">💬 Chat - Room: ${roomId}</div>
          <button class="detached-close-btn" onclick="window.close()">✕</button>
        </div>
        
        <div class="detached-chat-messages" id="detached-messages">
          ${chatMessages.length === 0 
            ? '<div class="detached-chat-empty">No messages yet. Start the conversation!</div>'
            : chatMessages.map(msg => `
                <div class="detached-chat-message">
                  <span class="detached-chat-user">${msg.userName ? msg.userName.slice(0, 8) : 'User'}:</span>
                  ${msg.message || ''}
                </div>
              `).join('')
          }
        </div>
        
        <form class="detached-chat-input-form" id="detached-chat-form">
          <input 
            class="detached-chat-input" 
            type="text" 
            placeholder="Type a message..." 
            maxlength="200"
            id="detached-input"
            value="${chatInput || ''}"
          />
          <button type="submit" class="detached-chat-send-btn">Send</button>
        </form>
      </div>
    `;

    // Add event listeners
    const form = targetWindow.document.getElementById('detached-chat-form');
    const input = targetWindow.document.getElementById('detached-input');
    
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (message) {
          // Use the setChatInput to update the parent component's state
          setChatInput(message);
          
          // Create a synthetic event to send the message
          const syntheticEvent = {
            preventDefault: () => {},
            target: { value: message }
          };
          
          // Send the message using the parent's sendChatMessage function
          sendChatMessage(syntheticEvent);
          
          // Clear the input
          input.value = '';
          setChatInput('');
        }
      });

      input.addEventListener('input', (e) => {
        setChatInput(e.target.value);
      });

      // Focus input
      input.focus();
    }

    // Auto-scroll to bottom
    const messagesContainer = targetWindow.document.getElementById('detached-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const openChatInNewTab = () => {
    const chatWindow = window.open('', '_blank', 'width=400,height=600');
    if (chatWindow) {
      chatWindow.document.write(`
        <html>
          <head>
            <title>Chat - Collaborative Code Editor</title>
            <style>
              body { margin: 0; font-family: 'Outfit', sans-serif; background: #191a1b; color: white; }
              .chat-container { height: 100vh; padding: 1rem; box-sizing: border-box; }
            </style>
          </head>
          <body>
            <div class="chat-container">
              <h3>Chat moved to new tab</h3>
              <p>The chat functionality will be available here.</p>
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="resizable-layout" ref={containerRef}>
      {/* Sidebar */}
      <div 
        className="resizable-sidebar" 
        style={{ width: `${sidebarWidth}px` }}
      >
        {sidebar}
      </div>

      {/* Sidebar resize handle */}
      <div
        className="resize-handle sidebar-resize"
        ref={sidebarResizeRef}
        onMouseDown={handleSidebarMouseDown}
      />

      {/* Editor area */}
      <div className="resizable-editor">
        {editor}
      </div>

      {/* Chat panel (only if not detached) */}
      {!isChatDetached && (
        <>
          {/* Chat resize handle */}
          {!isChatMinimized && (
            <div
              className="resize-handle chat-resize"
              onMouseDown={handleChatMouseDown}
            />
          )}
          
          <div 
            className={`resizable-chat ${isChatMinimized ? 'minimized' : ''}`}
            style={{ width: isChatMinimized ? '50px' : `${chatWidth}px` }}
          >
            <div className="chat-header">
              <div className="chat-controls">
                <button 
                  className="chat-control-btn minimize"
                  onClick={toggleChatMinimize}
                  title={isChatMinimized ? "Expand Chat" : "Minimize Chat"}
                >
                  {isChatMinimized ? '📈' : '📉'}
                </button>
                <button 
                  className="chat-control-btn detach"
                  onClick={openChatInNewWindow}
                  title="Open Chat in New Window"
                >
                  🗗
                </button>
              </div>
              {!isChatMinimized && <h3>Chat</h3>}
            </div>
            {!isChatMinimized && (
              <div className="chat-content">
                {chatPanel}
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating chat panel */}
      {isFloating && (
        <div
          className="floating-chat"
          ref={floatingChatRef}
          style={{
            left: `${floatingChatPosition.x}px`,
            top: `${floatingChatPosition.y}px`,
            width: `${chatWidth}px`
          }}
        >
          <div 
            className="floating-chat-header"
            onMouseDown={handleChatDragStart}
          >
            <span>💬 Chat (Floating)</span>
            <div className="floating-chat-controls">
              <button 
                className="chat-control-btn attach"
                onClick={attachChat}
                title="Attach Chat Back"
              >
                📎
              </button>
              <button 
                className="chat-control-btn new-tab"
                onClick={openChatInNewTab}
                title="Open in New Tab"
              >
                �
              </button>
            </div>
          </div>
          <div className="floating-chat-content">
            {chat}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResizableLayout;
