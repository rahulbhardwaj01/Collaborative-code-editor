# Collaborative Code Editor

A modern, real-time collaborative code editor built with React, Vite, Node.js, and Socket.IO. This project enables multiple users to join a shared coding room, edit code together, communicate via chat, and collaborate through integrated video calls—all in the browser, with no login required.

🚀 Live Site
👉 [Visit here]https://collaborative-code-editor-0qwj.onrender.com/

🛠️ Tech Stack
Node.js
React + Vite
Socket.io
Express.js
Render for Deployment

## Features

### 🚀 Real-Time Collaborative Code Editing
- Multiple users can join the same room and edit code together in real time.
- Language selection (JavaScript, Python, Java) for syntax highlighting.
- Live user list showing who is present in the room.
- Typing indicator to show when someone is editing.

### 💬 Real-Time Room Chat
- Integrated chat panel for each code room.
- Send and receive messages instantly with all room participants.
- Usernames displayed with each message.
- No login required—just enter a room ID and your name.

### 🎥 Video Call Collaboration
- Floating, draggable video call panel in the editor UI.
- All users in a room automatically join the call (camera and mic are off by default).
- Toggle camera and microphone independently at any time.
- Visual indicators show which users have their camera or mic on/off.
- Live microphone volume bar for your own video tile, showing speech intensity in real time.
- Video tiles for all users with camera on; placeholder for those with camera off.

### 🖥️ Modern UI/UX
- Responsive, clean interface with sidebar for room info and chat.
- Editor powered by Monaco (the same editor as VS Code).
- Floating video call panel can be dragged anywhere in the editor area.

## Getting Started

1. **Install dependencies:**
   - Backend: `npm install` in the project root
   - Frontend: `npm install` in `frontend/vite-project`
2. **Start the backend:**
   ```sh
   npm run start
   ```
3. **Start the frontend:**
   ```sh
   cd frontend/vite-project
   npm run dev
   ```
4. **Open your browser:**
   - Go to `http://localhost:5173` (or the port shown in your terminal)

## Tech Stack
- **Frontend:** React, Vite, Monaco Editor, Socket.IO, Simple-Peer (WebRTC)
- **Backend:** Node.js, Express, Socket.IO

## Usage
- Enter a room ID and your name to join a collaborative session.
- Edit code, chat, and use video call features with other participants in the same room.

---

Feel free to contribute or suggest new features!
