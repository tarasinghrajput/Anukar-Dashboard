const mongoose = require('mongoose');

// Append-only log - no updates or deletes allowed
const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, immutable: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  reasoningSummary: { type: String },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

// Indexes for efficient queries
logSchema.index({ timestamp: -1 });
logSchema.index({ taskId: 1 });
logSchema.index({ actor: 1 });

// Prevent updates and deletes (append-only)
logSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Logs are append-only and cannot be modified'));
});

logSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  next(new Error('Logs are append-only and cannot be deleted'));
});

module.exports = mongoose.model('Log', logSchema);
