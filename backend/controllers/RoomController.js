// Room controller - handles room-related socket events and business logic
import roomService from '../services/RoomService.js';
import userService from '../services/UserService.js';

class RoomController {
  constructor(io) {
    this.io = io; // Store io instance for broadcasting
  }
  // Handle user joining a room
  handleJoinRoom(socket, { roomId, userName }) {
    try {
      // Create user if doesn't exist
      let user = userService.getUser(socket.id);
      if (!user) {
        user = userService.createUser(socket.id, userName);
      } else {
        // Update user name if changed
        userService.updateUserName(socket.id, userName);
      }

      // Leave previous room if any
      const previousRoom = user.getCurrentRoom();
      if (previousRoom) {
        socket.leave(previousRoom);
        const { users } = roomService.removeUserFromRoom(previousRoom, user.userName);
        this.io.in(previousRoom).emit("userJoined", users);
      }

      // Join new room
      socket.join(roomId);
      userService.updateUserRoom(socket.id, roomId);
      const { users } = roomService.addUserToRoom(roomId, userName);

      // Send room files to the newly joined user
      const roomFiles = roomService.getRoomFiles(roomId);
      if (roomFiles) {
        socket.emit("roomFilesResponse", roomFiles);
      }

      // Notify all users in the room
      socket.to(roomId).emit("userJoined", users);
      
      console.log(`User ${userName} joined room ${roomId}`);
      return { success: true, users };
    } catch (error) {
      console.error('Error in handleJoinRoom:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle code changes in room
  handleCodeChange(socket, { roomId, code }) {
    try {
      const updatedCode = roomService.updateRoomCode(roomId, code);
        if (updatedCode !== null) {
          // Broadcast to all users in the room, including sender
          this.io.in(roomId).emit("codeUpdated", code);
          return { success: true };
        }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleCodeChange:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle file content changes in room
  handleFileContentChange(socket, { roomId, fileId, content }) {
    try {
      const updatedFile = roomService.updateFileContent(roomId, fileId, content);
      if (updatedFile !== null) {
        socket.to(roomId).emit("fileContentUpdated", { fileId, content, file: updatedFile });
        return { success: true };
      }
      return { success: false, error: 'Room or file not found' };
    } catch (error) {
      console.error('Error in handleFileContentChange:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle language changes in room
  handleLanguageChange(socket, { roomId, language }) {
    try {
      const updatedLanguage = roomService.updateRoomLanguage(roomId, language);
      if (updatedLanguage !== null) {
        socket.to(roomId).emit("languageUpdated", language);
        return { success: true };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleLanguageChange:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle file language changes in room
  handleFileLanguageChange(socket, { roomId, fileId, language }) {
    try {
      const updatedFile = roomService.updateFileLanguage(roomId, fileId, language);
      if (updatedFile !== null) {
        socket.to(roomId).emit("fileLanguageUpdated", { fileId, language, file: updatedFile });
        return { success: true };
      }
      return { success: false, error: 'Room or file not found' };
    } catch (error) {
      console.error('Error in handleFileLanguageChange:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle creating new file
  handleCreateFile(socket, { roomId, name, content, language }) {
    try {
      const newFile = roomService.createFileInRoom(roomId, name, content, language);
      if (newFile !== null) {
        this.io.to(roomId).emit("fileCreated", newFile);
        return { success: true, file: newFile };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleCreateFile:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle renaming file
  handleRenameFile(socket, { roomId, fileId, newName }) {
    try {
      const renamedFile = roomService.renameFileInRoom(roomId, fileId, newName);
      if (renamedFile !== null) {
        this.io.to(roomId).emit("fileRenamed", { fileId, newName, file: renamedFile });
        return { success: true, file: renamedFile };
      }
      return { success: false, error: 'Room or file not found' };
    } catch (error) {
      console.error('Error in handleRenameFile:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle deleting file
  handleDeleteFile(socket, { roomId, fileId }) {
    try {
      const result = roomService.deleteFileInRoom(roomId, fileId);
      if (result !== null) {
        if (result.success) {
          this.io.to(roomId).emit("fileDeleted", { fileId, activeFileId: result.activeFileId });
          return { success: true, activeFileId: result.activeFileId };
        } else {
          return { success: false, error: result.error };
        }
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleDeleteFile:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle setting active file
  handleSetActiveFile(socket, { roomId, fileId }) {
    try {
      const activeFile = roomService.setActiveFileInRoom(roomId, fileId);
      if (activeFile !== null) {
        this.io.to(roomId).emit("activeFileChanged", { fileId, file: activeFile });
        return { success: true, file: activeFile };
      }
      return { success: false, error: 'Room or file not found' };
    } catch (error) {
      console.error('Error in handleSetActiveFile:', error);
      return { success: false, error: error.message };
    }
  }

  // Get room files
  handleGetRoomFiles(socket, { roomId }) {
    try {
      const roomFiles = roomService.getRoomFiles(roomId);
      if (roomFiles !== null) {
        socket.emit("roomFilesResponse", roomFiles);
        return { success: true, files: roomFiles };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleGetRoomFiles:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle user leaving room
  handleLeaveRoom(socket) {
    try {
      const user = userService.getUser(socket.id);
      if (user && user.getCurrentRoom()) {
        const roomId = user.getCurrentRoom();
        const userName = user.userName;

        socket.leave(roomId);
        userService.removeUserFromRoom(socket.id);
        const { users } = roomService.removeUserFromRoom(roomId, userName);

        socket.to(roomId).emit("userJoined", users);
        console.log(`User ${userName} left room ${roomId}`);
        return { success: true };
      }
      return { success: false, error: 'User not in room' };
    } catch (error) {
      console.error('Error in handleLeaveRoom:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle typing indicator
  handleTyping(socket, { roomId, userName }) {
    try {
      userService.updateUserTyping(socket.id, true);
      socket.to(roomId).emit("userTyping", userName);
      return { success: true };
    } catch (error) {
      console.error('Error in handleTyping:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle chat messages
  handleChatMessage(socket, { roomId, userName, message }) {
    try {
      const messageObj = roomService.addMessageToRoom(roomId, userName, message);
      if (messageObj) {
        // Send to all users in the room including sender
        this.io.to(roomId).emit("chatMessage", { userName, message });
        return { success: true, message: messageObj };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleChatMessage:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle user disconnect
  handleDisconnect(socket) {
    try {
      const user = userService.getUser(socket.id);
      if (user) {
        const roomId = user.getCurrentRoom();
        const userName = user.userName;

        if (roomId) {
          const { users } = roomService.removeUserFromRoom(roomId, userName);
          socket.to(roomId).emit("userJoined", users);
        }

        userService.removeUser(socket.id);
        console.log(`User ${userName} disconnected`);
      }
      return { success: true };
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
      return { success: false, error: error.message };
    }
  }

  // Get room info
  getRoomInfo(roomId) {
    try {
      return roomService.getRoomInfo(roomId);
    } catch (error) {
      console.error('Error in getRoomInfo:', error);
      return null;
    }
  }

  // Get room statistics
  getRoomStats() {
    try {
      return roomService.getRoomStats();
    } catch (error) {
      console.error('Error in getRoomStats:', error);
      return null;
    }
  }

  // Version control handlers (basic implementation)
  handleUndo(socket, { roomId }) {
    try {
      // Basic implementation - for now just return current state
      const roomInfo = roomService.getRoomInfo(roomId);
      if (roomInfo) {
        socket.emit("codeReverted", {
          code: roomInfo.files.find(f => f.id === roomInfo.activeFileId)?.content || '',
          language: roomInfo.files.find(f => f.id === roomInfo.activeFileId)?.language || 'javascript',
          action: 'undo',
          performer: 'system',
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            currentVersionIndex: 0,
            totalVersions: 1
          }
        });
        return { success: true };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleUndo:', error);
      return { success: false, error: error.message };
    }
  }

  handleRedo(socket, { roomId }) {
    try {
      // Basic implementation - for now just return current state
      const roomInfo = roomService.getRoomInfo(roomId);
      if (roomInfo) {
        socket.emit("codeReverted", {
          code: roomInfo.files.find(f => f.id === roomInfo.activeFileId)?.content || '',
          language: roomInfo.files.find(f => f.id === roomInfo.activeFileId)?.language || 'javascript',
          action: 'redo',
          performer: 'system',
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            currentVersionIndex: 0,
            totalVersions: 1
          }
        });
        return { success: true };
      }
      return { success: false, error: 'Room not found' };
    } catch (error) {
      console.error('Error in handleRedo:', error);
      return { success: false, error: error.message };
    }
  }

  handleCreateCheckpoint(socket, { roomId, code, language }) {
    try {
      // Basic implementation - just acknowledge
      socket.emit("checkpointCreated", {
        performer: 'system'
      });
      return { success: true };
    } catch (error) {
      console.error('Error in handleCreateCheckpoint:', error);
      return { success: false, error: error.message };
    }
  }

  handleGetUndoRedoState(socket, { roomId }) {
    try {
      // Basic implementation - return basic state
      socket.emit("undoRedoStateResponse", {
        success: true,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          currentVersionIndex: 0,
          totalVersions: 1
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error in handleGetUndoRedoState:', error);
      return { success: false, error: error.message };
    }
  }
}

export default RoomController; 