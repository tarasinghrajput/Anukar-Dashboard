const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['specialist', 'core'],
    default: 'specialist'
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'blocked'],
    default: 'idle'
  },
  currentTaskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  },
  currentTaskTitle: {
    type: String,
    default: null
  },
  load: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  capabilities: [{
    type: String
  }],
  tools: [{
    type: String
  }],
  performanceMetrics: {
    successRate: { type: Number, default: 0, min: 0, max: 100 },
    avgExecutionTime: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    failedTasks: { type: Number, default: 0 }
  },
  lastOutput: { 
    type: String 
  },
  lastActiveAt: {
    type: Date,
    default: null
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
agentSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Agent', agentSchema);
