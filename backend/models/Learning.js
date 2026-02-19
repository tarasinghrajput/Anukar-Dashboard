const mongoose = require('mongoose');

const learningSchema = new mongoose.Schema({
  description: { type: String, required: true },
  triggerEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Log' },
  affectedAgents: [{ type: String }],
  impactSummary: { type: String },
  confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
  version: { type: Number, default: 1 },
  category: { type: String },
  createdAt: { type: Date, default: Date.now }
});

learningSchema.index({ createdAt: -1 });
learningSchema.index({ affectedAgents: 1 });

module.exports = mongoose.model('Learning', learningSchema);
