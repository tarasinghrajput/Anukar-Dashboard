/**
 * Agent Integration Helper
 * Handles communication between Anukar agents and the dashboard
 */

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:3000';

/**
 * Assign a task to an agent (marks agent as active)
 * @param {string} agentName - Agent identifier (researcher, devops, comms)
 * @param {string} taskId - Task ID from dashboard
 * @param {string} taskTitle - Human-readable task title
 * @returns {Promise<Object>} - Updated agent data
 */
async function assignAgentTask(agentName, taskId, taskTitle) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/agents/${agentName}/assign-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, taskTitle })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to assign task: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error assigning task:', error);
    throw error;
  }
}

/**
 * Complete a task (marks agent as idle)
 * @param {string} agentName - Agent identifier
 * @param {string} taskId - Task ID
 * @param {string} output - Summary of task output
 * @param {boolean} success - Whether task completed successfully
 * @returns {Promise<Object>} - Updated agent data
 */
async function completeAgentTask(agentName, taskId, output, success = true) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/agents/${agentName}/complete-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, output, success })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error completing task:', error);
    throw error;
  }
}

/**
 * Get agent's current status
 * @param {string} agentName - Agent identifier
 * @returns {Promise<Object>} - Agent status data
 */
async function getAgentStatus(agentName) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/agents/${agentName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get agent status: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error getting agent status:', error);
    throw error;
  }
}

/**
 * Get agent's task history
 * @param {string} agentName - Agent identifier
 * @param {number} limit - Number of history entries to retrieve
 * @returns {Promise<Array>} - Array of history entries
 */
async function getAgentHistory(agentName, limit = 10) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/agents/${agentName}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get agent history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error getting agent history:', error);
    throw error;
  }
}

/**
 * Get all agents status overview
 * @returns {Promise<Object>} - Stats about all agents
 */
async function getAgentsStats() {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/agents/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to get agents stats: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error getting agents stats:', error);
    throw error;
  }
}

/**
 * Create a task in the dashboard
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string} agentName - Agent this task is assigned to
 * @returns {Promise<Object>} - Created task data
 */
async function createTask(title, description, agentName) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        status: 'in_progress',
        assignedAgent: agentName,
        startedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error creating task:', error);
    throw error;
  }
}

/**
 * Update task status
 * @param {string} taskId - Task ID
 * @param {string} status - New status (in_progress, done, blocked)
 * @param {Object} updates - Additional updates
 * @returns {Promise<Object>} - Updated task data
 */
async function updateTask(taskId, status, updates = {}) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        ...updates,
        ...(status === 'done' ? { completedAt: new Date().toISOString() } : {})
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error updating task:', error);
    throw error;
  }
}

/**
 * Log agent activity
 * @param {string} action - Action type (AGENT_STARTED, AGENT_COMPLETED, etc.)
 * @param {string} reasoningSummary - Human-readable description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Created log entry
 */
async function logActivity(action, reasoningSummary, metadata = {}) {
  try {
    const response = await fetch(`${AGENT_API_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor: 'anukar-core',
        action,
        reasoningSummary,
        metadata
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AgentIntegration] Error logging activity:', error);
    throw error;
  }
}

/**
 * Full workflow: Assign task to agent and create task entry
 * @param {string} agentName - Agent identifier
 * @param {string} taskTitle - Task title
 * @param {string} taskDescription - Task description
 * @returns {Promise<Object>} - { task, agent }
 */
async function initializeAgentTask(agentName, taskTitle, taskDescription) {
  try {
    // 1. Create task in dashboard
    const task = await createTask(taskTitle, taskDescription, agentName);
    
    // 2. Mark agent as active
    const agent = await assignAgentTask(agentName, task._id, taskTitle);
    
    // 3. Log activity
    await logActivity('AGENT_DELEGATED', `Delegated "${taskTitle}" to ${agentName}`, {
      agentName,
      taskId: task._id
    });
    
    return { task, agent };
  } catch (error) {
    console.error('[AgentIntegration] Error initializing agent task:', error);
    throw error;
  }
}

/**
 * Full workflow: Complete task and mark agent as idle
 * @param {string} agentName - Agent identifier
 * @param {string} taskId - Task ID
 * @param {string} taskTitle - Task title
 * @param {string} output - Task output/summary
 * @param {boolean} success - Whether task succeeded
 * @returns {Promise<Object>} - { task, agent }
 */
async function finalizeAgentTask(agentName, taskId, taskTitle, output, success = true) {
  try {
    // 1. Mark agent as idle
    const agent = await completeAgentTask(agentName, taskId, output, success);
    
    // 2. Update task status
    const task = await updateTask(taskId, success ? 'done' : 'blocked', {
      description: output
    });
    
    // 3. Log activity
    await logActivity(
      success ? 'AGENT_COMPLETED' : 'AGENT_FAILED',
      `${agentName} ${success ? 'completed' : 'failed'} "${taskTitle}"`,
      { agentName, taskId, success, outputLength: output.length }
    );
    
    return { task, agent };
  } catch (error) {
    console.error('[AgentIntegration] Error finalizing agent task:', error);
    throw error;
  }
}

/**
 * Check if dashboard API is healthy
 * @returns {Promise<boolean>} - True if healthy
 */
async function healthCheck() {
  try {
    const response = await fetch(`${AGENT_API_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('[AgentIntegration] Health check failed:', error);
    return false;
  }
}

module.exports = {
  assignAgentTask,
  completeAgentTask,
  getAgentStatus,
  getAgentHistory,
  getAgentsStats,
  createTask,
  updateTask,
  logActivity,
  initializeAgentTask,
  finalizeAgentTask,
  healthCheck
};
