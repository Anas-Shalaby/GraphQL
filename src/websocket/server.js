const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.rooms = new Map(); // Track room memberships
    this.users = new Map(); // Track connected users

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.user = decoded;
        next();
      } catch (error) {
        return next(new Error("Authentication error"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      // Store user connection
      this.users.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        rooms: new Set(),
      });

      // Handle user going online
      socket.emit("user:online", { userId: socket.userId });

      // Handle joining board rooms
      socket.on("board:join", (data) => {
        const { boardId } = data;
        if (boardId) {
          socket.join(`board:${boardId}`);

          // Track room membership
          const user = this.users.get(socket.userId);
          if (user) {
            user.rooms.add(`board:${boardId}`);
          }

          // Track room members
          if (!this.rooms.has(`board:${boardId}`)) {
            this.rooms.set(`board:${boardId}`, new Set());
          }
          this.rooms.get(`board:${boardId}`).add(socket.userId);

          // Notify other users in the room
          socket.to(`board:${boardId}`).emit("user:joined_board", {
            userId: socket.userId,
            userName: socket.user.name,
            boardId,
          });
        }
      });

      // Handle leaving board rooms
      socket.on("board:leave", (data) => {
        const { boardId } = data;
        if (boardId) {
          socket.leave(`board:${boardId}`);

          // Remove from tracking
          const user = this.users.get(socket.userId);
          if (user) {
            user.rooms.delete(`board:${boardId}`);
          }

          const room = this.rooms.get(`board:${boardId}`);
          if (room) {
            room.delete(socket.userId);
            if (room.size === 0) {
              this.rooms.delete(`board:${boardId}`);
            }
          }
        }
      });

      // Handle user activity
      socket.on("user:activity", (data) => {
        const { type, boardId, ...activityData } = data;

        // Broadcast activity to board members
        if (boardId) {
          socket.to(`board:${boardId}`).emit("user:activity", {
            userId: socket.userId,
            userName: socket.user.name,
            type,
            boardId,
            ...activityData,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`User ${socket.userId} disconnected`);

        // Clean up user data
        const user = this.users.get(socket.userId);
        if (user) {
          // Notify rooms that user left
          user.rooms.forEach((roomId) => {
            const room = this.rooms.get(roomId);
            if (room) {
              room.delete(socket.userId);
              if (room.size === 0) {
                this.rooms.delete(roomId);
              }
            }

            // Notify other users in the room
            socket.to(roomId).emit("user:left_board", {
              userId: socket.userId,
              userName: socket.user.name,
              boardId: roomId.replace("board:", ""),
            });
          });

          this.users.delete(socket.userId);
        }
      });
    });
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    const user = this.users.get(userId);
    if (user) {
      this.io.to(user.socketId).emit("notification", notification);
    }
  }

  // Send notification to all users in a board
  sendBoardNotification(boardId, notification) {
    this.io.to(`board:${boardId}`).emit("notification", notification);
  }

  // Broadcast board update
  broadcastBoardUpdate(boardId, update) {
    this.io.to(`board:${boardId}`).emit("board:updated", update);
  }

  // Broadcast task update
  broadcastTaskUpdate(boardId, update) {
    this.io.to(`board:${boardId}`).emit("task:updated", update);
  }

  // Broadcast member update
  broadcastMemberUpdate(boardId, update) {
    this.io.to(`board:${boardId}`).emit("member:updated", update);
  }

  // Broadcast column update
  broadcastColumnUpdate(boardId, update) {
    this.io.to(`board:${boardId}`).emit("column:updated", update);
  }

  // Get connected users count for a board
  getBoardUsersCount(boardId) {
    const room = this.rooms.get(`board:${boardId}`);
    return room ? room.size : 0;
  }

  // Get all connected users for a board
  getBoardUsers(boardId) {
    const room = this.rooms.get(`board:${boardId}`);
    if (!room) return [];

    return Array.from(room)
      .map((userId) => {
        const user = this.users.get(userId);
        return user ? user.user : null;
      })
      .filter(Boolean);
  }
}

module.exports = WebSocketServer;
