// Logging middleware for request tracking
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log response details after request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Socket connection logger
export const socketLogger = (socket, next) => {
  console.log(`${new Date().toISOString()} - Socket connected: ${socket.id}`);
  next();
};

// Error logger for socket events
export const socketErrorLogger = (error) => {
  console.error(`${new Date().toISOString()} - Socket error:`, error);
}; 