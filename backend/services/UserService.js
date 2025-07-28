// User service - handles business logic for user operations
import User from '../models/User.js';

class UserService {
  constructor() {
    this.users = new Map(); // In-memory user storage by socket ID
  }

  // Create a new user
  createUser(socketId, userName) {
    const user = new User(socketId, userName);
    this.users.set(socketId, user);
    return user;
  }

  // Get user by socket ID
  getUser(socketId) {
    return this.users.get(socketId);
  }

  // Remove user
  removeUser(socketId) {
    const user = this.users.get(socketId);
    if (user) {
      this.users.delete(socketId);
      return user;
    }
    return null;
  }

  // Update user's current room
  updateUserRoom(socketId, roomId) {
    const user = this.getUser(socketId);
    if (user) {
      return user.joinRoom(roomId);
    }
    return null;
  }

  // Remove user from current room
  removeUserFromRoom(socketId) {
    const user = this.getUser(socketId);
    if (user) {
      return user.leaveRoom();
    }
    return null;
  }

  // Update user's typing status
  updateUserTyping(socketId, isTyping) {
    const user = this.getUser(socketId);
    if (user) {
      return user.setTyping(isTyping);
    }
    return false;
  }

  // Update user's call status
  updateUserCallStatus(socketId, isInCall) {
    const user = this.getUser(socketId);
    if (user) {
      if (isInCall) {
        return user.joinCall();
      } else {
        return user.leaveCall();
      }
    }
    return false;
  }

  // Toggle user's camera
  toggleUserCamera(socketId) {
    const user = this.getUser(socketId);
    if (user) {
      return user.toggleCamera();
    }
    return false;
  }

  // Toggle user's microphone
  toggleUserMicrophone(socketId) {
    const user = this.getUser(socketId);
    if (user) {
      return user.toggleMicrophone();
    }
    return false;
  }

  // Get user info
  getUserInfo(socketId) {
    const user = this.getUser(socketId);
    return user ? user.getInfo() : null;
  }

  // Update user name
  updateUserName(socketId, newName) {
    const user = this.getUser(socketId);
    if (user) {
      return user.updateName(newName);
    }
    return null;
  }

  // Get all users in a room
  getUsersInRoom(roomId) {
    const usersInRoom = [];
    for (const [socketId, user] of this.users) {
      if (user.getCurrentRoom() === roomId) {
        usersInRoom.push(user.getInfo());
      }
    }
    return usersInRoom;
  }

  // Get all connected users
  getAllUsers() {
    const allUsers = [];
    for (const [socketId, user] of this.users) {
      allUsers.push(user.getInfo());
    }
    return allUsers;
  }

  // Get user statistics
  getUserStats() {
    const stats = {
      totalUsers: this.users.size,
      usersInRooms: 0,
      usersInCalls: 0
    };

    for (const [socketId, user] of this.users) {
      if (user.getCurrentRoom()) {
        stats.usersInRooms++;
      }
      if (user.isInCall) {
        stats.usersInCalls++;
      }
    }

    return stats;
  }
}

export default new UserService(); 