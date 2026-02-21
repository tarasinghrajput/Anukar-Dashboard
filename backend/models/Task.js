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
  // Agent assignment fields
  assignedAgent: { 
    type: String,
    enum: ['researcher', 'devops', 'comms', null],
    default: null
  },
  agentType: {
    type: String,
    default: null
  },
  delegationId: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  dependencyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  logs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Log' }],
  // Metadata for external data sources (GitHub, Google Sheets, etc.)
  metadata: {
    source: { type: String, enum: ['github', 'sheet', 'manual'], default: 'manual' },
    // GitHub specific
    githubIssueNumber: { type: Number },
    githubUrl: { type: String },
    // Google Sheet specific
    sheetTaskId: { type: String },
    reporter: { type: String },
    taskType: { type: String },
    // Common fields
    priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], default: 'P2' },
    tookHelpFromRoshan: { type: String }
  },
  // Progress tracking
  progressUpdates: [{
    text: { type: String },
    time: { type: Date, default: Date.now }
  }],
  result: { type: String },
  blockedReason: { type: String },
  error: { type: String },
  // Task output fields
  outputFile: { type: String, default: null },
  outputType: { type: String, enum: ['research', 'draft', 'code', 'log', null], default: null },
  tokensUsed: { type: Number, default: 0 },
  agentName: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ parentTaskId: 1 });

module.exports = mongoose.model('Task', taskSchema);
