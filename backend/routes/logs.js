const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { emitEvent } = require('../socket');

// Get all logs with filters
router.get('/', async (req, res) => {
  try {
    const { actor, action, taskId, startDate, endDate, limit = 100, offset = 0 } = req.query;
    const filter = {};
    
    if (actor) filter.actor = actor;
    if (action) filter.action = action;
    if (taskId) filter.taskId = taskId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await Log.find(filter)
      .populate('taskId', 'title status')
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Log.countDocuments(filter);
    res.json({ logs, total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single log
router.get('/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id).populate('taskId');
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create log entry (manual logging)
router.post('/', async (req, res) => {
  try {
    const log = await Log.create(req.body);
    emitEvent('LOG_CREATED', log);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get log statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const stats = await Log.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const actorStats = await Log.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$actor',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ byAction: stats, byActor: actorStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
