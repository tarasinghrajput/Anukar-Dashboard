const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  status: {
    type: String,
    enum: ['idle', 'active', 'blocked'],
    default: 'idle'
  },
  currentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  load: { type: Number, default: 0, min: 0, max: 100 },
  performanceMetrics: {
    successRate: { type: Number, default: 0, min: 0, max: 100 },
    avgExecutionTime: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    failedTasks: { type: Number, default: 0 }
  },
  lastOutput: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agent', agentSchema);
