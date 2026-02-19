const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['queued', 'active', 'blocked', 'completed', 'failed'],
    default: 'queued'
  },
  source: {
    type: String,
    enum: ['human', 'core', 'sub-agent'],
    default: 'human'
  },
  assignedTo: { type: String },
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  dependencyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  logs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Log' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ parentTaskId: 1 });

module.exports = mongoose.model('Task', taskSchema);
