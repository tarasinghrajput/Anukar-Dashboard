const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['spec', 'memory', 'learning', 'log', 'plan'],
    required: true
  },
  content: { type: String, required: true },
  linkedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  version: { type: Number, default: 1 },
  tags: [{ type: String }],
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for search
documentSchema.index({ title: 'text', content: 'text' });
documentSchema.index({ type: 1 });
documentSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
