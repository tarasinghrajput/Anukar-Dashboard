const mongoose = require('mongoose');

const agentHistorySchema = new mongoose.Schema({
  agentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Agent',
    required: true 
  },
  agentName: { 
    type: String, 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task',
    required: false 
  },
  taskTitle: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'failed', 'timeout'],
    required: true
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  },
  duration: { 
    type: Number, // milliseconds
    default: 0
  },
  output: { 
    type: String // Summary/result
  },
  error: { 
    type: String // Error message if failed
  },
  metadata: {
    type: Object, // Additional context
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
agentHistorySchema.index({ agentId: 1, startedAt: -1 });
agentHistorySchema.index({ taskId: 1 });

// Method to calculate duration on completion
agentHistorySchema.methods.complete = function(status, output, error = null) {
  this.status = status;
  this.completedAt = new Date();
  this.duration = this.completedAt - this.startedAt;
  this.output = output;
  if (error) this.error = error;
  return this.save();
};

module.exports = mongoose.model('AgentHistory', agentHistorySchema);
