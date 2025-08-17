import React, { useState } from 'react';
import './FileTab.css';

const FileTab = ({ 
  file, 
  isActive, 
  onClick, 
  onClose, 
  onRename, 
  isRenamable = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(file.filename);

  const handleDoubleClick = () => {
    if (isRenamable) {
      setIsEditing(true);
      setNewName(file.filename);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== file.filename) {
      onRename(file.filename, newName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setNewName(file.filename);
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose(file.filename);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return '📄';
      case 'ts':
      case 'tsx':
        return '📘';
      case 'py':
        return '🐍';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'txt':
        return '📄';
      default:
        return '📄';
    }
  };

  return (
    <div 
      className={`file-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      title={`${file.filename} - ${isActive ? 'Active' : 'Click to open'}`}
    >
      <span className="file-icon">{getFileIcon(file.filename)}</span>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="file-rename-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            className="file-rename-input"
            autoFocus
          />
        </form>
      ) : (
        <span className="file-name">{file.filename}</span>
      )}
      
      {onClose && (
        <button 
          className="file-close-btn"
          onClick={handleCloseClick}
          title="Close file"
        >
          ×
        </button>
      )}
      
      {file.lastModified && !isActive && (
        <span className="file-modified-indicator" title="File has unsaved changes">
          •
        </span>
      )}
    </div>
  );
};

export default FileTab;
