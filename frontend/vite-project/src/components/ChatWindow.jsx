import React, { useEffect, useRef } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ 
  chatMessages, 
  chatInput, 
  setChatInput, 
  sendChatMessage, 
  onClose 
}) => {
  const windowRef = useRef(null);

  useEffect(() => {
    // Open new window for detached chat
    const newWindow = window.open(
      '',
      'ChatWindow',
      'width=400,height=500,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
    );

    if (newWindow) {
      windowRef.current = newWindow;
      
      // Set up the detached window content
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

      // Handle window close
      newWindow.addEventListener('beforeunload', () => {
        onClose();
      });

      // Initial render
      renderChatContent(newWindow);
    }

    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, []);

  const renderChatContent = (targetWindow) => {
    if (!targetWindow || targetWindow.closed) return;

    targetWindow.document.body.innerHTML = `
      <div class="detached-chat-container">
        <div class="detached-chat-header">
          <div class="detached-chat-title">💬 Chat</div>
          <button class="detached-close-btn" onclick="window.close()">✕</button>
        </div>
        
        <div class="detached-chat-messages" id="detached-messages">
          ${chatMessages.length === 0 
            ? '<div class="detached-chat-empty">No messages yet. Start the conversation!</div>'
            : chatMessages.map(msg => `
                <div class="detached-chat-message">
                  <span class="detached-chat-user">${msg.userName.slice(0, 8)}:</span>
                  ${msg.message}
                </div>
              `).join('')
          }
        </div>
        
        <form class="detached-chat-input-form" id="detached-chat-form">
          <input 
            class="detached-chat-input" 
            type="text" 
            placeholder="Type a message..." 
            value="${chatInput}"
            maxlength="200"
            id="detached-input"
          />
          <button type="submit" class="detached-chat-send-btn">Send</button>
        </form>
      </div>
    `;

    // Add event listeners
    const form = targetWindow.document.getElementById('detached-chat-form');
    const input = targetWindow.document.getElementById('detached-input');
    
    // Set up input value
    if (input) {
    input.value = chatInput || "";
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('input', (e) => {
      setChatInput(e.target.value);
    });
    input.focus();
  }

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value.trim()) {
          sendChatMessage(e);
          input.value = '';
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

  // Re-render when messages change
  useEffect(() => {
    if (windowRef.current && !windowRef.current.closed) {
      renderChatContent(windowRef.current);
    }
  }, [chatMessages, chatInput]);

  // This component doesn't render anything in the main window
  return null;
};

export default ChatWindow;
