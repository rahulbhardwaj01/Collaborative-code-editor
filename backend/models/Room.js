// Room model - handles room data and operations
import roomDatabase from '../config/database.js';

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.users = new Set();
    this.code = ''; // Current code in the room
    this.language = 'javascript'; // Default language
    this.messages = []; // Chat messages
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

  // Update code in room
  updateCode(code) {
    this.code = code;
    return this.code;
  }

  // Get current code
  getCode() {
    return this.code;
  }

  // Update language
  updateLanguage(language) {
    this.language = language;
    return this.language;
  }

  // Get current language
  getLanguage() {
    return this.language;
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
      language: this.language
    };
  }
}

export default Room; 