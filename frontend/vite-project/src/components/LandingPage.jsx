import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(true);

  const handleCreateRoom = () => {
    if (userName.trim()) {
      const newRoomId = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newRoomId);
      onJoinRoom(newRoomId, userName.trim());
    }
  };

  const handleJoinRoom = () => {
    if (userName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), userName.trim());
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">&lt;/&gt;</span>
            <span className="logo-text">CodeCollaborate</span>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Collaborate in real-time with others.
                <span className="highlight"> Edit code, share instantly,</span>
                and work together seamlessly.
              </h1>
              <p className="hero-description">
                Build together, learn together, code together. Experience the power of 
                real-time collaborative coding with developers around the world.
              </p>
              
              {/* Create/Join Room Form */}
              <div className="room-actions">
                <div className="mode-toggle">
                  <button 
                    className={`mode-btn ${isCreateMode ? 'active' : ''}`}
                    onClick={() => setIsCreateMode(true)}
                  >
                    Create Room
                  </button>
                  <button 
                    className={`mode-btn ${!isCreateMode ? 'active' : ''}`}
                    onClick={() => setIsCreateMode(false)}
                  >
                    Join Room
                  </button>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="input-field"
                  />
                  
                  {!isCreateMode && (
                    <input
                      type="text"
                      placeholder="Enter Room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      className="input-field"
                      maxLength="15"
                    />
                  )}
                  
                  {isCreateMode ? (
                    <button 
                      onClick={handleCreateRoom}
                      className="cta-button"
                      disabled={!userName.trim()}
                    >
                      Create & Join Room
                    </button>
                  ) : (
                    <button 
                      onClick={handleJoinRoom}
                      className="cta-button"
                      disabled={!userName.trim() || !roomId.trim()}
                    >
                      Join Room
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="code-preview">
                <div className="code-header">
                  <div className="code-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="code-title">collaborative-code.js</span>
                </div>
                <div className="code-content">
                  <div className="code-line">
                    <span className="line-number">1</span>
                    <span className="code-text">
                      <span className="keyword">function</span> <span className="function">collaborate</span>() {'{'}
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">2</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="keyword">const</span> <span className="variable">magic</span> = <span className="string">'real-time'</span>;
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">3</span>
                    <span className="code-text">
                      &nbsp;&nbsp;<span className="keyword">return</span> <span className="variable">magic</span>;
                    </span>
                  </div>
                  <div className="code-line">
                    <span className="line-number">4</span>
                    <span className="code-text">{'}'}</span>
                  </div>
                </div>
                <div className="typing-indicator">
                  <div className="cursor-1"></div>
                  <div className="cursor-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose CodeCollaborate?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Collaboration</h3>
              <p>See changes instantly as people type. Multiple users can work on the same file together seamlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Multiple Languages</h3>
              <p>Support for JavaScript, Python, HTML, CSS, and many other programming languages with syntax highlighting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Easy Sharing</h3>
              <p>Just share the room ID or URL with your team to start collaborating instantly. No setup required.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Built-in Chat</h3>
              <p>Communicate with your team while coding. Share ideas and discuss changes in real-time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📹</div>
              <h3>Video Calls</h3>
              <p>Connect face-to-face with your collaborators for better communication and teamwork.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Version History</h3>
              <p>Track changes and revert to previous versions. Never lose your work with automatic version control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create or Join</h3>
              <p>Create a new room or join an existing one with a room ID</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Start Coding</h3>
              <p>Write code together in real-time with syntax highlighting</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Collaborate</h3>
              <p>Chat, video call, and build amazing projects together</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="logo">
                <span className="logo-icon">&lt;/&gt;</span>
                <span className="logo-text">CodeCollaborate</span>
              </div>
              <p>Collaborate on code in real-time with developers around the world.</p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>Real-time Editing</li>
                <li>Video Calls</li>
                <li>Chat</li>
                <li>Version History</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 CodeCollaborate. All rights reserved. Crafted with ❤️ for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
