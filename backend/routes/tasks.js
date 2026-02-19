const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Log = require('../models/Log');
const { emitEvent } = require('../socket');

// Get all tasks with filters
router.get('/', async (req, res) => {
  try {
    const { status, assignedTo, source, limit = 50, offset = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (source) filter.source = source;

    const tasks = await Task.find(filter)
      .populate('parentTaskId', 'title status')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);
    res.json({ tasks, total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('parentTaskId')
      .populate('dependencyIds')
      .populate('logs');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    // Log the event
    const log = await Log.create({
      actor: req.body.source || 'human',
      action: 'TASK_CREATED',
      taskId: task._id,
      reasoningSummary: `Task "${task.title}" created`
    });
    
    // Emit WebSocket event
    emitEvent('TASK_CREATED', task);
    emitEvent('LOG_CREATED', log);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Log the event
    const log = await Log.create({
      actor: 'system',
      action: 'TASK_STATUS_CHANGED',
      taskId: task._id,
      reasoningSummary: reason || `Task status changed to ${status}`,
      metadata: { newStatus: status }
    });
    
    emitEvent('TASK_STATUS_CHANGED', task);
    emitEvent('LOG_CREATED', log);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign task to agent
router.patch('/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: agentId, status: 'active', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const log = await Log.create({
      actor: 'core',
      action: 'AGENT_ASSIGNED',
      taskId: task._id,
      reasoningSummary: `Task assigned to ${agentId}`,
      metadata: { agentId }
    });
    
    emitEvent('AGENT_ASSIGNED', task);
    emitEvent('LOG_CREATED', log);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task (soft delete by setting status to failed)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'failed', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const log = await Log.create({
      actor: 'human',
      action: 'TASK_DELETED',
      taskId: task._id,
      reasoningSummary: `Task "${task.title}" deleted`
    });
    
    emitEvent('TASK_DELETED', task);
    emitEvent('LOG_CREATED', log);
    
    res.json({ message: 'Task deleted', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task dependencies graph
router.get('/:id/graph', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Get all related tasks
    const tasks = await Task.find({
      $or: [
        { _id: task._id },
        { parentTaskId: task._id },
        { _id: { $in: task.dependencyIds } }
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
