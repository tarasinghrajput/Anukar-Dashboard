const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Log = require('../models/Log');
const { emitEvent } = require('../socket');

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find().populate('currentTaskId');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('currentTaskId');
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create agent
router.post('/', async (req, res) => {
  try {
    const agent = await Agent.create(req.body);
    
    const log = await Log.create({
      actor: 'system',
      action: 'AGENT_CREATED',
      reasoningSummary: `Agent "${agent.name}" created with role: ${agent.role}`,
      metadata: { agentId: agent._id, role: agent.role }
    });
    
    emitEvent('AGENT_CREATED', agent);
    emitEvent('LOG_CREATED', log);
    
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update agent status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    const log = await Log.create({
      actor: 'system',
      action: 'AGENT_STATUS_CHANGED',
      reasoningSummary: reason || `Agent status changed to ${status}`,
      metadata: { agentId: agent._id, newStatus: status }
    });
    
    emitEvent('AGENT_STATUS_CHANGED', agent);
    emitEvent('LOG_CREATED', log);
    
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update agent load/metrics
router.patch('/:id/metrics', async (req, res) => {
  try {
    const { load, successRate, avgExecutionTime, lastOutput } = req.body;
    
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    if (load !== undefined) agent.load = load;
    if (lastOutput !== undefined) agent.lastOutput = lastOutput;
    if (successRate !== undefined) agent.performanceMetrics.successRate = successRate;
    if (avgExecutionTime !== undefined) agent.performanceMetrics.avgExecutionTime = avgExecutionTime;
    
    agent.updatedAt = Date.now();
    await agent.save();
    
    emitEvent('AGENT_METRICS_UPDATED', agent);
    
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    const log = await Log.create({
      actor: 'system',
      action: 'AGENT_DELETED',
      reasoningSummary: `Agent "${agent.name}" deleted`,
      metadata: { agentId: agent._id }
    });
    
    emitEvent('AGENT_DELETED', agent);
    emitEvent('LOG_CREATED', log);
    
    res.json({ message: 'Agent deleted', agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
