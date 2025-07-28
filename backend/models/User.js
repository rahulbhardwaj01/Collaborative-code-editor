// User model - handles user data and operations
class User {
  constructor(socketId, userName) {
    this.socketId = socketId;
    this.userName = userName;
    this.currentRoom = null;
    this.isTyping = false;
    this.isInCall = false;
    this.cameraOn = false;
    this.micOn = false;
    this.connectedAt = new Date();
  }

  // Join a room
  joinRoom(roomId) {
    this.currentRoom = roomId;
    return this.currentRoom;
  }

  // Leave current room
  leaveRoom() {
    const previousRoom = this.currentRoom;
    this.currentRoom = null;
    return previousRoom;
  }

  // Get current room
  getCurrentRoom() {
    return this.currentRoom;
  }

  // Set typing status
  setTyping(isTyping) {
    this.isTyping = isTyping;
    return this.isTyping;
  }

  // Get typing status
  getTyping() {
    return this.isTyping;
  }

  // Join video call
  joinCall() {
    this.isInCall = true;
    return this.isInCall;
  }

  // Leave video call
  leaveCall() {
    this.isInCall = false;
    this.cameraOn = false;
    this.micOn = false;
    return this.isInCall;
  }

  // Toggle camera
  toggleCamera() {
    this.cameraOn = !this.cameraOn;
    return this.cameraOn;
  }

  // Toggle microphone
  toggleMicrophone() {
    this.micOn = !this.micOn;
    return this.micOn;
  }

  // Get user info
  getInfo() {
    return {
      socketId: this.socketId,
      userName: this.userName,
      currentRoom: this.currentRoom,
      isTyping: this.isTyping,
      isInCall: this.isInCall,
      cameraOn: this.cameraOn,
      micOn: this.micOn,
      connectedAt: this.connectedAt
    };
  }

  // Update user name
  updateName(newName) {
    this.userName = newName;
    return this.userName;
  }
}

export default User; 