const express = require('express');
const router = express.Router();
const SystemState = require('../models/SystemState');
const Task = require('../models/Task');
const Agent = require('../models/Agent');
const Log = require('../models/Log');
const { emitEvent } = require('../socket');

// Get current system state
router.get('/', async (req, res) => {
  try {
    const state = await SystemState.getInstance()
      .then(s => s.populate('activeTaskId'));
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system state
router.put('/', async (req, res) => {
  try {
    const state = await SystemState.getInstance();
    Object.assign(state, req.body);
    state.updatedAt = Date.now();
    await state.save();
    
    emitEvent('SYSTEM_STATE_CHANGED', state);
    res.json(state);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get system health metrics
router.get('/health', async (req, res) => {
  try {
    const [
      totalTasks,
      activeTasks,
      blockedTasks,
      completedTasks,
      failedTasks,
      totalAgents,
      activeAgents,
      recentLogs
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'active' }),
      Task.countDocuments({ status: 'blocked' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'failed' }),
      Agent.countDocuments(),
      Agent.countDocuments({ status: 'active' }),
      Log.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    // Calculate average execution time
    const avgTimeResult = await Task.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: {
              $subtract: ['$updatedAt', '$createdAt']
            }
          }
        }
      }
    ]);
    const avgExecutionTime = avgTimeResult[0]?.avgTime || 0;

    // Agent load
    const agents = await Agent.find({}, 'name load status');
    const avgAgentLoad = agents.reduce((sum, a) => sum + a.load, 0) / (agents.length || 1);

    // Blocked ratio
    const blockedRatio = totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0;

    // Error rate (last 24h)
    const errorRate = recentLogs > 0 
      ? await Log.countDocuments({
          action: { $regex: /FAILED|ERROR/i },
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }) / recentLogs * 100
      : 0;

    res.json({
      tasks: {
        total: totalTasks,
        active: activeTasks,
        blocked: blockedTasks,
        completed: completedTasks,
        failed: failedTasks,
        blockedRatio: blockedRatio.toFixed(2),
        avgExecutionTime
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
        avgLoad: avgAgentLoad.toFixed(2),
        details: agents
      },
      logs: {
        last24h: recentLogs,
        errorRate: errorRate.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system state history (based on logs)
router.get('/history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const history = await Log.find({
      action: { $in: ['SYSTEM_STATE_CHANGED', 'CORE_DECISION_MADE', 'MODE_CHANGED'] }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
