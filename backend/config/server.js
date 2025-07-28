// Server configuration settings
export const serverConfig = {
  port: process.env.PORT || 3000,
  cors: {
    origin: "*", // In production, specify exact origins
    methods: ["GET", "POST"],
    credentials: true
  },
  socket: {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  }
};

// Static file serving configuration
export const staticConfig = {
  path: "../frontend/vite-project/dist",
  options: {
    index: "index.html"
  }
}; 