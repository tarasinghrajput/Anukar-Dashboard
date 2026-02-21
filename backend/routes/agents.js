const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const AgentHistory = require('../models/AgentHistory');
const Task = require('../models/Task');
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

// Helper to find agent by ID or name
async function findAgent(idOrName) {
  try {
    let agent = await Agent.findById(idOrName).populate('currentTaskId');
    if (agent) return agent;
  } catch (error) {
    // Not a valid ObjectId, try name lookup
  }
  // Try finding by name
  return await Agent.findOne({ name: idOrName }).populate('currentTaskId');
}

// Get single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await findAgent(req.params.id);
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

// Initialize specialist agents (create the 3 agents if they don't exist)
router.post('/initialize', async (req, res) => {
  try {
    const specialistAgents = [
      {
        name: 'researcher',
        role: 'Intel & Deep Dives',
        type: 'specialist',
        capabilities: ['web_research', 'competitor_analysis', 'market_research', 'data_gathering', 'trend_monitoring'],
        tools: ['web_search', 'web_fetch', 'browser', 'image']
      },
      {
        name: 'devops',
        role: 'GitHub & Infrastructure',
        type: 'specialist',
        capabilities: ['ci_monitoring', 'repo_health_checks', 'issue_triage', 'pr_review', 'deployment_tracking'],
        tools: ['exec', 'gh', 'git', 'browser']
      },
      {
        name: 'comms',
        role: 'Writing & Messaging',
        type: 'specialist',
        capabilities: ['email_drafting', 'social_media_posts', 'documentation_writing', 'messaging', 'summaries'],
        tools: ['message', 'write', 'gog', 'exec']
      }
    ];
    
    const created = [];
    const existing = [];
    
    for (const agentData of specialistAgents) {
      const existingAgent = await Agent.findOne({ name: agentData.name });
      
      if (existingAgent) {
        existing.push(existingAgent);
      } else {
        const agent = await Agent.create(agentData);
        created.push(agent);
        
        const log = await Log.create({
          actor: 'system',
          action: 'AGENT_CREATED',
          reasoningSummary: `Specialist agent "${agent.name}" initialized`,
          metadata: { agentId: agent._id, type: agent.type }
        });
        
        emitEvent('AGENT_CREATED', agent);
        emitEvent('LOG_CREATED', log);
      }
    }
    
    res.json({
      message: 'Specialist agents initialized',
      created: created.length,
      existing: existing.length,
      agents: [...created, ...existing]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent history
router.get('/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const agent = await findAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    const history = await AgentHistory.find({ agentId: agent._id })
      .sort({ startedAt: -1 })
      .limit(limit)
      .populate('taskId');
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign task to agent (mark as active)
router.post('/:id/assign-task', async (req, res) => {
  try {
    const { taskId, taskTitle } = req.body;
    
    const agent = await findAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    // Update agent status
    agent.status = 'active';
    agent.currentTaskId = taskId;
    agent.currentTaskTitle = taskTitle;
    agent.lastActiveAt = new Date();
    agent.load = Math.min(100, agent.load + 20); // Increase load by 20%
    agent.updatedAt = Date.now();
    await agent.save();
    
    // Create history entry
    const history = await AgentHistory.create({
      agentId: agent._id,
      agentName: agent.name,
      taskId: taskId,
      taskTitle: taskTitle,
      status: 'started',
      startedAt: new Date()
    });
    
    // Update task
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        status: 'active',
        assignedAgent: agent.name,
        startedAt: new Date()
      });
    }
    
    const log = await Log.create({
      actor: 'anukar-core',
      action: 'AGENT_TASK_STARTED',
      reasoningSummary: `Agent "${agent.name}" started task: ${taskTitle}`,
      metadata: { agentId: agent._id, taskId, taskTitle }
    });
    
    emitEvent('AGENT_TASK_STARTED', { agent, history, taskId, taskTitle });
    emitEvent('LOG_CREATED', log);
    
    res.json({ agent, history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete task (mark agent as idle)
router.post('/:id/complete-task', async (req, res) => {
  try {
    const { taskId, output, success } = req.body;
    
    const agent = await findAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    
    // Update agent status
    agent.status = 'idle';
    agent.currentTaskId = null;
    agent.currentTaskTitle = null;
    agent.load = Math.max(0, agent.load - 20); // Decrease load by 20%
    agent.lastOutput = output;
    agent.updatedAt = Date.now();
    
    // Update performance metrics
    agent.performanceMetrics.totalTasks += 1;
    if (success) {
      agent.performanceMetrics.completedTasks += 1;
    } else {
      agent.performanceMetrics.failedTasks += 1;
    }
    
    // Recalculate success rate
    agent.performanceMetrics.successRate = 
      (agent.performanceMetrics.completedTasks / agent.performanceMetrics.totalTasks) * 100;
    
    await agent.save();
    
    // Update history entry
    const history = await AgentHistory.findOne({
      agentId: agent._id,
      taskId: taskId,
      status: 'started'
    }).sort({ startedAt: -1 });
    
    if (history) {
      await history.complete(success ? 'completed' : 'failed', output);
    }
    
    // Update task
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        status: success ? 'completed' : 'failed',
        completedAt: new Date(),
        result: output
      });
    }
    
    const log = await Log.create({
      actor: 'anukar-core',
      action: success ? 'AGENT_TASK_COMPLETED' : 'AGENT_TASK_FAILED',
      reasoningSummary: `Agent "${agent.name}" ${success ? 'completed' : 'failed'} task`,
      metadata: { agentId: agent._id, taskId, success, outputLength: output?.length || 0 }
    });
    
    emitEvent('AGENT_TASK_COMPLETED', { agent, history, taskId, success, output });
    emitEvent('LOG_CREATED', log);
    
    res.json({ agent, history });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const agents = await Agent.find({ type: 'specialist' });
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalAgents = agents.length;
    
    const recentCompletions = await AgentHistory.find({
      status: { $in: ['completed', 'failed'] },
      completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).countDocuments();
    
    const tasksInProgress = await Task.find({
      status: 'active',
      assignedAgent: { $ne: null }
    }).countDocuments();
    
    const avgLoad = agents.reduce((sum, a) => sum + a.load, 0) / (totalAgents || 1);
    
    res.json({
      totalAgents,
      activeAgents,
      tasksInProgress,
      avgLoad: Math.round(avgLoad),
      recentCompletions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
