import React, { useState } from 'react';
import FileTab from './FileTab';
import './FileExplorer.css';
import { detectFileType } from '../utils/fileTypeDetection';

const FileExplorer = ({ 
  files = [], 
  activeFile, 
  onFileCreate, 
  onFileDelete, 
  onFileRename, 
  onFileSwitch,
  userName
}) => {
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(null);

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      const filename = newFileName.trim();
      const language = detectFileType(filename) || 'javascript';
      onFileCreate(filename, userName, '', language);
      setNewFileName('');
      setShowNewFileForm(false);
    }
  };

  const handleFileDelete = (filename) => {
    if (files.length <= 1) {
      alert('Cannot delete the last file in the room');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      onFileDelete(filename, userName);
    }
    setShowContextMenu(null);
  };

  const handleContextMenu = (e, filename) => {
    e.preventDefault();
    setShowContextMenu({ filename, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setShowContextMenu(null);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Files</h3>
        <button 
          className="new-file-btn"
          onClick={() => setShowNewFileForm(!showNewFileForm)}
          title="Create new file"
        >
          +
        </button>
      </div>

      {showNewFileForm && (
        <div className="new-file-form-container">
          <form onSubmit={handleCreateFile} className="new-file-form">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter filename (e.g., main.js)"
              className="new-file-input"
              autoFocus
            />
            <div className="new-file-buttons">
              <button type="submit" className="create-btn">Create</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowNewFileForm(false);
                  setNewFileName('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="file-tabs-container">
        {files.map((file) => (
          <div
            key={file.filename}
            onContextMenu={(e) => handleContextMenu(e, file.filename)}
          >
            <FileTab
              file={file}
              isActive={file.filename === activeFile}
              onClick={() => onFileSwitch(file.filename, userName)}
              onClose={files.length > 1 ? (filename) => handleFileDelete(filename) : null}
              onRename={onFileRename}
              isRenamable={true}
            />
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="no-files-message">
          No files in this room. Create a new file to get started.
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: showContextMenu.x,
            top: showContextMenu.y,
            zIndex: 1000
          }}
        >
          <button
            className="context-menu-item"
            onClick={() => handleFileDelete(showContextMenu.filename)}
            disabled={files.length <= 1}
          >
            Delete File
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              // Trigger rename by simulating double click on the tab
              closeContextMenu();
            }}
          >
            Rename File
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
