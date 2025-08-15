import React, { useState } from 'react';
import './FileTabs.css';

const FileTabs = ({ 
  files, 
  activeFileId, 
  onTabClick, 
  onCreateFile, 
  onRenameFile, 
  onDeleteFile, 
  onCloseTab 
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleRenameStart = (file) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renamingFileId) {
      onRenameFile(renamingFileId, renameValue.trim());
      setRenamingFileId(null);
      setRenameValue('');
    }
  };

  const handleRenameCancel = () => {
    setRenamingFileId(null);
    setRenameValue('');
  };

  const handleDeleteFile = (fileId, fileName) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      onDeleteFile(fileId);
    }
  };

  return (
    <div className="file-tabs-container">
      <div className="file-tabs">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-tab ${activeFileId === file.id ? 'active' : ''}`}
          >
            {renamingFileId === file.id ? (
              <div className="rename-input-container">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  autoFocus
                  className="rename-input"
                />
              </div>
            ) : (
              <>
                <span
                  className="tab-name"
                  onClick={() => onTabClick(file.id)}
                  title={file.name}
                >
                  {file.name}
                </span>
                <div className="tab-actions">
                  <button
                    className="tab-action-btn rename-btn"
                    onClick={() => handleRenameStart(file)}
                    title="Rename file"
                  >
                    ✏️
                  </button>
                  {files.length > 1 && (
                    <button
                      className="tab-action-btn close-btn"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      title="Delete file"
                    >
                      ✖️
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        
        {isCreatingFile ? (
          <div className="file-tab new-file-tab">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => {
                if (!newFileName.trim()) {
                  setIsCreatingFile(false);
                } else {
                  handleCreateFile();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setNewFileName('');
                }
              }}
              placeholder="filename.ext"
              autoFocus
              className="new-file-input"
            />
          </div>
        ) : (
          <button
            className="new-file-btn"
            onClick={() => setIsCreatingFile(true)}
            title="Create new file"
          >
            + New File
          </button>
        )}
      </div>
    </div>
  );
};

export default FileTabs;
