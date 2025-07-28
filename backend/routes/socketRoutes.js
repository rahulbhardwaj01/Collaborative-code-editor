// Socket routes - handles all socket events and delegates to controllers
import RoomController from '../controllers/RoomController.js';
import VideoCallController from '../controllers/VideoCallController.js';

class SocketRoutes {
  constructor() {
    this.roomController = null;
    this.videoCallController = null;
  }
  // Initialize socket event handlers
  initializeSocketHandlers(io) {
    io.on("connection", (socket) => {
      console.log("A user connected", socket.id);

      // Room-related events
      socket.on("join_room", (data) => {
        const result = roomController.handleJoinRoom(socket, data);
        if (!result.success) {
          console.error('Join room error:', result.error);
        }
      });

      socket.on("codeChange", (data) => {
        const result = roomController.handleCodeChange(socket, data);
        if (!result.success) {
          console.error('Code change error:', result.error);
        }
      });

      socket.on("languageChange", (data) => {
        const result = roomController.handleLanguageChange(socket, data);
        if (!result.success) {
          console.error('Language change error:', result.error);
        }
      });

      socket.on("leaveRoom", () => {
        const result = roomController.handleLeaveRoom(socket);
        if (!result.success) {
          console.error('Leave room error:', result.error);
        }
      });

      socket.on("typing", (data) => {
        const result = roomController.handleTyping(socket, data);
        if (!result.success) {
          console.error('Typing error:', result.error);
        }
      });

      socket.on("chatMessage", (data) => {
        const result = roomController.handleChatMessage(socket, data);
        if (!result.success) {
          console.error('Chat message error:', result.error);
        }
      });

      // Video call events
      socket.on("join-call", (data) => {
        const result = videoCallController.handleJoinCall(socket, data);
        if (!result.success) {
          console.error('Join call error:', result.error);
        }
      });

      socket.on("signal", (data) => {
        const result = videoCallController.handleSignal(socket, data);
        if (!result.success) {
          console.error('Signal error:', result.error);
        }
      });

      socket.on("leave-call", (data) => {
        const result = videoCallController.handleLeaveCall(socket, data);
        if (!result.success) {
          console.error('Leave call error:', result.error);
        }
      });

      socket.on("toggle-camera", () => {
        const result = videoCallController.handleToggleCamera(socket);
        if (!result.success) {
          console.error('Toggle camera error:', result.error);
        }
      });

      socket.on("toggle-microphone", () => {
        const result = videoCallController.handleToggleMicrophone(socket);
        if (!result.success) {
          console.error('Toggle microphone error:', result.error);
        }
      });

      // Disconnect event
      socket.on("disconnect", () => {
        const result = roomController.handleDisconnect(socket);
        if (!result.success) {
          console.error('Disconnect error:', result.error);
        }
        console.log("A user disconnected", socket.id);
      });
    });
  }

  // Get room statistics (for admin/analytics)
  getRoomStats() {
    return roomController.getRoomStats();
  }

  // Get call statistics (for admin/analytics)
  getCallStats() {
    return videoCallController.getCallStats();
  }
}

export default new SocketRoutes(); 