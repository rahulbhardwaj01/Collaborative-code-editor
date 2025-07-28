// Video call controller - handles video call-related socket events
import userService from '../services/UserService.js';

class VideoCallController {
  // Handle user joining video call
  handleJoinCall(socket, { roomId, userName }) {
    try {
      const user = userService.getUser(socket.id);
      if (user) {
        // Join the call room (separate from main room)
        const callRoomId = roomId + "-call";
        socket.join(callRoomId);
        
        // Update user call status
        userService.updateUserCallStatus(socket.id, true);
        
        // Notify other users in the call
        socket.to(callRoomId).emit("user-joined-call", { 
          userName, 
          socketId: socket.id 
        });
        
        console.log(`User ${userName} joined video call in room ${roomId}`);
        return { success: true };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error in handleJoinCall:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle WebRTC signaling
  handleSignal(socket, { roomId, signal, to }) {
    try {
      // Forward the signal to the target user
      socket.to(to).emit("signal", { 
        signal, 
        from: socket.id 
      });
      return { success: true };
    } catch (error) {
      console.error('Error in handleSignal:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle user leaving video call
  handleLeaveCall(socket, { roomId }) {
    try {
      const user = userService.getUser(socket.id);
      if (user) {
        const callRoomId = roomId + "-call";
        socket.leave(callRoomId);
        
        // Update user call status
        userService.updateUserCallStatus(socket.id, false);
        
        // Notify other users in the call
        socket.to(callRoomId).emit("user-left-call", { 
          socketId: socket.id 
        });
        
        console.log(`User ${user.userName} left video call in room ${roomId}`);
        return { success: true };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error in handleLeaveCall:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle camera toggle
  handleToggleCamera(socket) {
    try {
      const user = userService.getUser(socket.id);
      if (user) {
        const cameraOn = userService.toggleUserCamera(socket.id);
        const roomId = user.getCurrentRoom();
        
        if (roomId) {
          const callRoomId = roomId + "-call";
          socket.to(callRoomId).emit("camera-toggled", {
            socketId: socket.id,
            cameraOn
          });
        }
        
        return { success: true, cameraOn };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error in handleToggleCamera:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle microphone toggle
  handleToggleMicrophone(socket) {
    try {
      const user = userService.getUser(socket.id);
      if (user) {
        const micOn = userService.toggleUserMicrophone(socket.id);
        const roomId = user.getCurrentRoom();
        
        if (roomId) {
          const callRoomId = roomId + "-call";
          socket.to(callRoomId).emit("microphone-toggled", {
            socketId: socket.id,
            micOn
          });
        }
        
        return { success: true, micOn };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error in handleToggleMicrophone:', error);
      return { success: false, error: error.message };
    }
  }

  // Get call participants
  getCallParticipants(roomId) {
    try {
      const callRoomId = roomId + "-call";
      const participants = userService.getUsersInRoom(roomId).filter(user => user.isInCall);
      return participants;
    } catch (error) {
      console.error('Error in getCallParticipants:', error);
      return [];
    }
  }

  // Handle call statistics
  getCallStats() {
    try {
      const stats = userService.getUserStats();
      return {
        totalUsers: stats.totalUsers,
        usersInCalls: stats.usersInCalls,
        callRooms: stats.usersInCalls > 0 ? Math.ceil(stats.usersInCalls / 2) : 0
      };
    } catch (error) {
      console.error('Error in getCallStats:', error);
      return null;
    }
  }
}

export default VideoCallController; 