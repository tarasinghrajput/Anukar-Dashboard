let io = null;

/**
 * Initialize socket.io instance
 */
function initSocket(socketIo) {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Join specific rooms for targeted updates
    socket.on('subscribe:task', (taskId) => {
      socket.join(`task:${taskId}`);
      console.log(`[Socket] ${socket.id} subscribed to task:${taskId}`);
    });
    
    socket.on('subscribe:agent', (agentId) => {
      socket.join(`agent:${agentId}`);
    });
    
    socket.on('subscribe:system', () => {
      socket.join('system');
    });
    
    socket.on('unsubscribe:task', (taskId) => {
      socket.leave(`task:${taskId}`);
    });
    
    socket.on('unsubscribe:agent', (agentId) => {
      socket.leave(`agent:${agentId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit event to all connected clients
 */
function emitEvent(eventName, data) {
  if (!io) {
    console.warn('[Socket] Cannot emit - socket.io not initialized');
    return;
  }
  
  console.log(`[Socket] Emitting ${eventName}`);
  io.emit(eventName, data);
}

/**
 * Emit event to specific room
 */
function emitToRoom(room, eventName, data) {
  if (!io) {
    console.warn('[Socket] Cannot emit - socket.io not initialized');
    return;
  }
  
  io.to(room).emit(eventName, data);
}

/**
 * Emit task-specific event
 */
function emitTaskEvent(taskId, eventName, data) {
  emitToRoom(`task:${taskId}`, eventName, data);
}

/**
 * Emit agent-specific event
 */
function emitAgentEvent(agentId, eventName, data) {
  emitToRoom(`agent:${agentId}`, eventName, data);
}

/**
 * Get connected clients count
 */
function getConnectedCount() {
  return io ? io.engine.clientsCount : 0;
}

module.exports = {
  initSocket,
  emitEvent,
  emitToRoom,
  emitTaskEvent,
  emitAgentEvent,
  getConnectedCount
};
