import React, { useState } from 'react';
import './KeyboardShortcuts.css';

const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('file');

  const shortcuts = {
    file: [
      { key: 'Ctrl+S', description: 'Save current file', category: 'File Operations' },
      { key: 'Ctrl+N', description: 'Create new file', category: 'File Operations' },
      { key: 'Ctrl+O', description: 'Quick file switcher', category: 'File Operations' },
      { key: 'Ctrl+W', description: 'Close current file', category: 'File Operations' },
      { key: 'Ctrl+Shift+R', description: 'Rename current file', category: 'File Operations' },
      { key: 'Ctrl+B', description: 'Toggle file explorer sidebar', category: 'File Operations' },
    ],
    editor: [
      { key: 'Ctrl+F', description: 'Find in file', category: 'Editor' },
      { key: 'Ctrl+H', description: 'Find and replace', category: 'Editor' },
      { key: 'Ctrl+G', description: 'Go to line', category: 'Editor' },
      { key: 'Ctrl+D', description: 'Duplicate line or selection', category: 'Editor' },
      { key: 'Ctrl+Shift+K', description: 'Delete current line', category: 'Editor' },
      { key: 'Ctrl+/', description: 'Toggle line comment', category: 'Editor' },
      { key: 'Ctrl+Shift+/', description: 'Toggle block comment', category: 'Editor' },
      { key: 'Alt+↑/↓', description: 'Move line up/down', category: 'Editor' },
      { key: 'Ctrl+Shift+L', description: 'Select all occurrences', category: 'Editor' },
      { key: 'Ctrl+Shift+A', description: 'Select all text', category: 'Editor' },
      { key: 'Ctrl+Shift+I', description: 'Auto-format document', category: 'Editor' },
      { key: 'Ctrl+Shift+E', description: 'Quick language switcher', category: 'Editor' },
      { key: 'F2', description: 'Rename symbol', category: 'Editor' },
    ],
    collaboration: [
      { key: 'Ctrl+Z', description: 'Undo last change', category: 'Collaboration' },
      { key: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Redo last change', category: 'Collaboration' },
      { key: 'Ctrl+Shift+C', description: 'Create checkpoint', category: 'Collaboration' },
      { key: 'Ctrl+Shift+V', description: 'Show version history', category: 'Collaboration' },
      { key: 'Ctrl+J', description: 'Toggle chat window', category: 'Collaboration' },
      { key: 'Ctrl+K', description: 'Clear chat history', category: 'Collaboration' },
    ],
    interface: [
      { key: 'Ctrl+T', description: 'Toggle dark/light theme', category: 'Interface' },
      { key: 'Ctrl+Shift+P', description: 'Show this shortcuts help', category: 'Interface' },
      { key: 'Ctrl+Shift+M', description: 'Toggle minimap', category: 'Interface' },
      { key: 'Ctrl+Shift+Q', description: 'Quick actions menu', category: 'Interface' },
      { key: 'Escape', description: 'Close dialogs and panels', category: 'Interface' },
    ]
  };

  const categories = [
    { id: 'file', name: 'File Operations', icon: '📁' },
    { id: 'editor', name: 'Editor', icon: '✏️' },
    { id: 'collaboration', name: 'Collaboration', icon: '👥' },
    { id: 'interface', name: 'Interface', icon: '🎨' }
  ];

  if (!isOpen) return null;

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="shortcuts-content">
          <div className="shortcuts-sidebar">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="shortcuts-list">
            <h3>{categories.find(c => c.id === activeCategory)?.name}</h3>
            <div className="shortcuts-grid">
              {shortcuts[activeCategory]?.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.key.split('+').map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="key">{key}</kbd>
                        {i < shortcut.key.split('+').length - 1 && <span className="plus">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="shortcut-description">{shortcut.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="shortcuts-footer">
          <p>💡 <strong>Tip:</strong> Press <kbd>Ctrl+Shift+P</kbd> anytime to see all shortcuts</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
