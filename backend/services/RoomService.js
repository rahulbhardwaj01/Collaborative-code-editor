// Room service - handles business logic for room operations
import Room from '../models/Room.js';

class RoomService {
  constructor() {
    this.rooms = new Map(); // In-memory room storage
  }

  // Get or create a room
  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }

  // Add user to room
  addUserToRoom(roomId, userName) {
    const room = this.getOrCreateRoom(roomId);
    const users = room.addUser(userName);
    return { room, users };
  }

  // Remove user from room
  removeUserFromRoom(roomId, userName) {
    const room = this.rooms.get(roomId);
    if (room) {
      const users = room.removeUser(userName);
      
      // Clean up empty rooms
      if (users.length === 0) {
        this.rooms.delete(roomId);
      }
      
      return { room, users };
    }
    return { room: null, users: [] };
  }

  // Update code in room
  updateRoomCode(roomId, code) {
    const room = this.rooms.get(roomId);
    if (room) {
      return room.updateCode(code);
    }
    return null;
  }

  // Update language in room
  updateRoomLanguage(roomId, language) {
    const room = this.rooms.get(roomId);
    if (room) {
      return room.updateLanguage(language);
    }
    return null;
  }

  // Add message to room
  addMessageToRoom(roomId, userName, message) {
    const room = this.rooms.get(roomId);
    if (room) {
      return room.addMessage(userName, message);
    }
    return null;
  }

  // Get room users
  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.getUsers() : [];
  }

  // Get room info
  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.getInfo() : null;
  }

  // Check if room exists
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Get all rooms (for admin purposes)
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }

  // Get room statistics
  getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      rooms: []
    };

    for (const [roomId, room] of this.rooms) {
      stats.rooms.push({
        roomId,
        userCount: room.getUsers().length,
        language: room.getLanguage()
      });
    }

    return stats;
  }
}

export default new RoomService(); 