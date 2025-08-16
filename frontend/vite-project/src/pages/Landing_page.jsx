import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function LandingPage({ onJoinRoom }) {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joinUserName, setJoinUserName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [enableVideoCalls, setEnableVideoCalls] = useState(true);
  const [enableLiveChat, setEnableLiveChat] = useState(true);
  const [dateTime, setDateTime] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);

  // Mock recent rooms data
  const [recentRooms] = useState([
    {
      id: "PROJ001",
      name: "PROJ001",
      description: "JavaScript Project",
      lastUsed: "2 hours ago"
    },
    {
      id: "TEAM01",
      name: "TEAM01",
      description: "Python Study Group",
      lastUsed: "1 day ago"
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert("Please enter your name before creating a room");
      return;
    }
    setIsCreating(true);
    const newRoomId = uuidv4().slice(0, 8).toUpperCase();
    setRoomId(newRoomId);

    // Auto-join the created room after a brief delay
    setTimeout(() => {
      onJoinRoom(newRoomId, userName.trim());
      setIsCreating(false);
    }, 800);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !joinUserName.trim()) {
      alert("Please enter both Room ID and your Name");
      return;
    }
    onJoinRoom(roomId.trim(), joinUserName.trim());
  };

  const joinRecentRoom = (room) => {
    if (!joinUserName.trim()) {
      alert("Please enter your name before joining a room");
      return;
    }
    onJoinRoom(room.id, joinUserName.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="glass-card p-3 rounded-2xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div className="ml-4" >
              <h1 className="mb-auto text-white text-lg font-semibold">Collaborative Code Editor</h1>
              <p className="text-purple-200 text-sm">Real-time coding collaboration</p>
            </div>
          </div>

          {/* Date Time Display */}
          <div className="glass-card px-4 py-2 rounded-xl text-right">
            <div className="text-white text-sm font-medium">
              {dateTime.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <div className="text-purple-200 text-xs font-mono">
              {dateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Code Together,<br />
            Create Together
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Experience real-time collaborative coding with integrated video calls, live chat, and intelligent version control.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="glass-card px-4 py-2 rounded-full flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" />
              </svg>
              <span className="text-white text-sm font-medium">Real-time Editing</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-full flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-white text-sm font-medium">Video Calls</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-full flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-white text-sm font-medium">Live Chat</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-full flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-white text-sm font-medium">Version History</span>
            </div>
          </div>
        </div>

        {/* Main Cards Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Create New Room Card */}
          <div className="glass-card-white rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Create New Room</h3>
              <p className="text-gray-600">Start a fresh collaborative session</p>
            </div>

            <form onSubmit={handleCreateRoom}>
              {/* Your Name Input */}
              <div className="mb-6">
                <label htmlFor="create-name" className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  id="create-name"
                  data-testid="input-create-name"
                  placeholder="Enter your display name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-black w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  maxLength={20}
                />
              </div>

              {/* Room Description */}
              <div className="mb-6">
                <label htmlFor="room-description" className="block text-sm font-semibold text-gray-700 mb-2">Room Description (Optional)</label>
                <textarea
                  id="room-description"
                  data-testid="textarea-room-description"
                  rows={3}
                  placeholder="What are you working on?"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  className="text-black w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Room Settings */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Room Settings</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      data-testid="checkbox-video-calls"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={enableVideoCalls}
                      onChange={(e) => setEnableVideoCalls(e.target.checked)}
                    />
                    <span className="ml-3 text-sm text-gray-700">Enable video calling</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      data-testid="checkbox-live-chat"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={enableLiveChat}
                      onChange={(e) => setEnableLiveChat(e.target.checked)}
                    />
                    <span className="ml-3 text-sm text-gray-700">Enable live chat</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                data-testid="button-create-room"
                disabled={isCreating || !userName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreating ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Room</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Join Existing Room Card */}
          <div className="glass-card-white rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Existing Room</h3>
              <p className="text-gray-600">Connect to an ongoing session</p>
            </div>

            <form onSubmit={handleJoinRoom}>
              {/* Room ID Input */}
              <div className="mb-6">
                <label htmlFor="room-id" className="block text-sm font-semibold text-gray-700 mb-2">Room ID</label>
                <input
                  type="text"
                  id="room-id"
                  data-testid="input-room-id"
                  placeholder="ENTER ROOM ID (E.G., ABC123)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="text-black w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase tracking-wider font-mono"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">Ask your teammate for the room ID</p>
              </div>

              {/* Your Name Input */}
              <div className="mb-6">
                <label htmlFor="join-name" className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  id="join-name"
                  data-testid="input-join-name"
                  placeholder="Enter your display name"
                  value={joinUserName}
                  onChange={(e) => setJoinUserName(e.target.value)}
                  className="text-black w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  maxLength={20}
                />
              </div>

              {/* Recent Rooms */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Recent Rooms</label>
                <div className="space-y-2">
                  {recentRooms.map((room) => (
                    <div
                      key={room.id}
                      data-testid={`recent-room-${room.id}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => joinRecentRoom(room)}
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900">{room.name}</div>
                        <div className="text-xs text-gray-500">{room.description}</div>
                      </div>
                      <div className="text-xs text-gray-400">{room.lastUsed}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                data-testid="button-join-room"
                disabled={!roomId.trim() || !joinUserName.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Join Room</span>
              </button>
            </form>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4">Powerful Features for Collaborative Development</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="feature-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Multi-Language Support</h4>
              <p className="text-purple-200 text-sm">JavaScript, Python, Java, and more</p>
            </div>

            <div className="feature-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Version Control</h4>
              <p className="text-purple-200 text-sm">Undo, redo, and checkpoint system</p>
            </div>

            <div className="feature-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Team Collaboration</h4>
              <p className="text-purple-200 text-sm">Real-time cursors and typing indicators</p>
            </div>

            <div className="feature-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Secure Sessions</h4>
              <p className="text-purple-200 text-sm">Private rooms with access control</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center">
              <p className="text-purple-200 text-sm mb-4">Built with React, Vite, Express, and Node.js • Real-time collaboration powered by Socket.io</p>
              <div className="flex justify-center space-x-4 gap-4 text-xs">
                <span className="text-purple-300">© 2025 Collaborative Code Editor</span>
                <span className="text-purple-300">•</span>
                <span className="text-purple-300">Open Source</span>
                <span className="text-purple-300">•</span>
                <span className="text-purple-300">Made with ❤️</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}