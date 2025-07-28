// Database configuration for managing room data
// In a production environment, this would connect to a real database
// For now, we're using in-memory storage with Map

class RoomDatabase {
  constructor() {
    // In-memory storage for rooms and their participants
    this.rooms = new Map();
  }

  // Create a new room
  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      return true;
    }
    return false;
  }

  // Add user to room
  addUserToRoom(roomId, userName) {
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId);
    }
    this.rooms.get(roomId).add(userName);
    return true;
  }

  // Remove user from room
  removeUserFromRoom(roomId, userName) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userName);
      return true;
    }
    return false;
  }

  // Get all users in a room
  getRoomUsers(roomId) {
    if (this.rooms.has(roomId)) {
      return Array.from(this.rooms.get(roomId));
    }
    return [];
  }

  // Check if room exists
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Get all rooms (for debugging/admin purposes)
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }
}

export default new RoomDatabase(); 