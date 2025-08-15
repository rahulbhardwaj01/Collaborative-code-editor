import { useState, useEffect } from 'react';
import './VersionHistory.css';

const VersionHistory = ({ socket, roomId, isOpen, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [undoRedoState, setUndoRedoState] = useState({
    canUndo: false,
    canRedo: false,
    currentVersionIndex: -1,
    totalVersions: 0
  });

  // Fetch version history
  const fetchVersionHistory = () => {
    if (socket && roomId) {
      setLoading(true);
      socket.emit('getVersionHistory', { roomId, limit: 50 });
    }
  };

  // Fetch undo/redo state
  const fetchUndoRedoState = () => {
    if (socket && roomId) {
      socket.emit('getUndoRedoState', { roomId });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersionHistory();
      fetchUndoRedoState();
    }
  }, [isOpen, roomId, socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for version history response
    socket.on('versionHistoryResponse', (response) => {
      setLoading(false);
      if (response.success) {
        setVersions(response.versions);
        setUndoRedoState(response.undoRedoState);
      } else {
        console.error('Failed to fetch version history:', response.error);
      }
    });

    // Listen for undo/redo state updates
    socket.on('undoRedoStateResponse', (response) => {
      if (response.success) {
        setUndoRedoState(response.undoRedoState);
      }
    });

    // Listen for version updates
    socket.on('versionAdded', (data) => {
      setUndoRedoState(data.undoRedoState);
      // Refresh version history
      if (isOpen) {
        fetchVersionHistory();
      }
    });

    // Listen for code reverts
    socket.on('codeReverted', (data) => {
      setUndoRedoState(data.undoRedoState);
      // Refresh version history
      if (isOpen) {
        fetchVersionHistory();
      }
    });

    // Listen for version details
    socket.on('versionDetailsResponse', (response) => {
      if (response.success) {
        setSelectedVersion(response.version);
      }
    });

    return () => {
      socket.off('versionHistoryResponse');
      socket.off('undoRedoStateResponse');
      socket.off('versionAdded');
      socket.off('codeReverted');
      socket.off('versionDetailsResponse');
    };
  }, [socket, isOpen]);

  const handleUndo = () => {
    if (socket && undoRedoState.canUndo) {
      socket.emit('undo', { roomId });
    }
  };

  const handleRedo = () => {
    if (socket && undoRedoState.canRedo) {
      socket.emit('redo', { roomId });
    }
  };

  const handleRevertToVersion = (versionId) => {
    if (socket && versionId) {
      const confirmRevert = window.confirm('Are you sure you want to revert to this version? This will create a new version.');
      if (confirmRevert) {
        socket.emit('revertToVersion', { roomId, versionId });
      }
    }
  };

  const handleViewVersion = (versionId) => {
    if (socket) {
      socket.emit('getVersionDetails', { roomId, versionId });
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getChangeTypeIcon = (changeType) => {
    switch (changeType) {
      case 'initial':
        return '🎯';
      case 'code_change':
        return '📝';
      case 'language_change':
        return '🔧';
      case 'revert':
        return '↶';
      case 'checkpoint':
        return '📌';
      default:
        return '📄';
    }
  };

  const getChangeTypeLabel = (changeType) => {
    switch (changeType) {
      case 'initial':
        return 'Initial';
      case 'code_change':
        return 'Code Change';
      case 'language_change':
        return 'Language Change';
      case 'revert':
        return 'Reverted';
      case 'checkpoint':
        return 'Checkpoint';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="version-history-modal">
      <div className="version-history-content">
        <div className="version-history-header">
          <h3>Version History</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="undo-redo-controls">
          <button 
            className={`undo-button ${!undoRedoState.canUndo ? 'disabled' : ''}`}
            onClick={handleUndo}
            disabled={!undoRedoState.canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            className={`redo-button ${!undoRedoState.canRedo ? 'disabled' : ''}`}
            onClick={handleRedo}
            disabled={!undoRedoState.canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <span className="version-info">
            {undoRedoState.currentVersionIndex + 1} / {undoRedoState.totalVersions}
          </span>
        </div>

        {/* Version List */}
        <div className="version-list">
          {loading ? (
            <div className="loading">Loading version history...</div>
          ) : versions.length > 0 ? (
            versions.map((version, index) => (
              <div key={version.versionId} className="version-item">
                <div className="version-header">
                  <span className="version-icon">
                    {getChangeTypeIcon(version.changeType)}
                  </span>
                  <div className="version-info">
                    <div className="version-meta">
                      <span className="version-user">{version.userName}</span>
                      <span className="version-type">{getChangeTypeLabel(version.changeType)}</span>
                    </div>
                    <div className="version-timestamp">
                      {formatTimestamp(version.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="version-details">
                  <span className="code-length">{version.codeLength} characters</span>
                  <span className="language">{version.language}</span>
                </div>
                <div className="version-actions">
                  <button 
                    className="view-button"
                    onClick={() => handleViewVersion(version.versionId)}
                  >
                    View
                  </button>
                  <button 
                    className="revert-button"
                    onClick={() => handleRevertToVersion(version.versionId)}
                  >
                    Revert
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-versions">No version history available</div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="version-history-footer">
          <button className="refresh-button" onClick={fetchVersionHistory}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Version Details Modal */}
      {selectedVersion && (
        <div className="version-details-modal">
          <div className="version-details-content">
            <div className="version-details-header">
              <h4>Version Details</h4>
              <button 
                className="close-details-button"
                onClick={() => setSelectedVersion(null)}
              >
                ×
              </button>
            </div>
            <div className="version-details-body">
              <div className="detail-row">
                <strong>User:</strong> {selectedVersion.userName}
              </div>
              <div className="detail-row">
                <strong>Type:</strong> {getChangeTypeLabel(selectedVersion.changeType)}
              </div>
              <div className="detail-row">
                <strong>Time:</strong> {formatTimestamp(selectedVersion.timestamp)}
              </div>
              <div className="detail-row">
                <strong>Language:</strong> {selectedVersion.language}
              </div>
              <div className="code-preview">
                <strong>Code Preview:</strong>
                <pre className="code-content">
                  {selectedVersion.code.substring(0, 500)}
                  {selectedVersion.code.length > 500 && '...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
