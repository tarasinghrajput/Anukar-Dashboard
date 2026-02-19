const mongoose = require('mongoose');

// Singleton system state - only one document exists
const systemStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'system_state', immutable: true },
  currentMode: {
    type: String,
    enum: ['idle', 'executing', 'blocked', 'learning'],
    default: 'idle'
  },
  activeTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  coreDecision: { type: String },
  confidence: { type: Number, default: 0, min: 0, max: 100 },
  activeSubAgents: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

// Ensure only one document exists
systemStateSchema.statics.getInstance = async function() {
  let state = await this.findById('system_state');
  if (!state) {
    state = await this.create({ _id: 'system_state' });
  }
  return state;
};

module.exports = mongoose.model('SystemState', systemStateSchema);
