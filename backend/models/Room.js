// Room model - handles room data and operations
import roomDatabase from '../config/database.js';

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.users = new Set();
    this.files = new Map(); // Map of fileId -> file object
    this.activeFileId = null; // Currently active file
    this.messages = []; // Chat messages
    this.fileIdCounter = 0; // Counter for generating file IDs
    
    // Create a default file
    this.createDefaultFile();
  }

  // Create default file
  createDefaultFile() {
    const defaultFile = {
      id: this.generateFileId(),
      name: 'untitled.js',
      content: '// Welcome to the collaborative code editor\n// Start coding here...',
      language: 'javascript',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    this.files.set(defaultFile.id, defaultFile);
    this.activeFileId = defaultFile.id;
  }

  // Generate unique file ID
  generateFileId() {
    return `file_${++this.fileIdCounter}_${Date.now()}`;
  }

  // Add user to room
  addUser(userName) {
    this.users.add(userName);
    roomDatabase.addUserToRoom(this.roomId, userName);
    return this.getUsers();
  }

  // Remove user from room
  removeUser(userName) {
    this.users.delete(userName);
    roomDatabase.removeUserFromRoom(this.roomId, userName);
    return this.getUsers();
  }

  // Get all users in room
  getUsers() {
    return Array.from(this.users);
  }

  // File management methods
  
  // Create new file
  createFile(name, content = '', language = 'javascript') {
    const file = {
      id: this.generateFileId(),
      name: name || `untitled_${this.fileIdCounter}.js`,
      content: content,
      language: language,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    this.files.set(file.id, file);
    return file;
  }

  // Update file content
  updateFileContent(fileId, content) {
    const file = this.files.get(fileId);
    if (file) {
      file.content = content;
      file.lastModified = new Date().toISOString();
      return file;
    }
    return null;
  }

  // Update file language
  updateFileLanguage(fileId, language) {
    const file = this.files.get(fileId);
    if (file) {
      file.language = language;
      file.lastModified = new Date().toISOString();
      return file;
    }
    return null;
  }

  // Rename file
  renameFile(fileId, newName) {
    const file = this.files.get(fileId);
    if (file) {
      file.name = newName;
      file.lastModified = new Date().toISOString();
      return file;
    }
    return null;
  }

  // Delete file
  deleteFile(fileId) {
    if (this.files.size <= 1) {
      return { success: false, error: 'Cannot delete the last file' };
    }
    
    const deleted = this.files.delete(fileId);
    if (deleted && this.activeFileId === fileId) {
      // Set first available file as active
      this.activeFileId = this.files.keys().next().value;
    }
    return { success: deleted, activeFileId: this.activeFileId };
  }

  // Set active file
  setActiveFile(fileId) {
    if (this.files.has(fileId)) {
      this.activeFileId = fileId;
      return this.files.get(fileId);
    }
    return null;
  }

  // Get file by ID
  getFile(fileId) {
    return this.files.get(fileId);
  }

  // Get active file
  getActiveFile() {
    return this.files.get(this.activeFileId);
  }

  // Get all files
  getAllFiles() {
    return Array.from(this.files.values());
  }

  // Legacy methods for backward compatibility
  updateCode(code) {
    if (this.activeFileId) {
      return this.updateFileContent(this.activeFileId, code);
    }
    return null;
  }

  getCode() {
    const activeFile = this.getActiveFile();
    return activeFile ? activeFile.content : '';
  }

  updateLanguage(language) {
    if (this.activeFileId) {
      return this.updateFileLanguage(this.activeFileId, language);
    }
    return null;
  }

  getLanguage() {
    const activeFile = this.getActiveFile();
    return activeFile ? activeFile.language : 'javascript';
  }

  // Add chat message
  addMessage(userName, message) {
    const messageObj = {
      userName,
      message,
      timestamp: new Date().toISOString()
    };
    this.messages.push(messageObj);
    return messageObj;
  }

  // Get recent messages (last 50)
  getMessages() {
    return this.messages.slice(-50);
  }

  // Check if user is in room
  hasUser(userName) {
    return this.users.has(userName);
  }

  // Get room info
  getInfo() {
    return {
      roomId: this.roomId,
      users: this.getUsers(),
      userCount: this.users.size,
      files: this.getAllFiles(),
      activeFileId: this.activeFileId,
      language: this.getLanguage() // For backward compatibility
    };
  }
}

export default Room; 