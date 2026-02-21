/**
 * Sub-Agent Dashboard Integration
 * 
 * Handles task registration and completion logging for sub-agents
 * This compensates for sub-agents not being able to execute dashboard commands
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mongoose = require('mongoose');
require('dotenv').config();

const DASHBOARD_BACKEND = '/home/aptest/.openclaw/workspace/Anukar-Dashboard/backend';

/**
 * Register a task before spawning a sub-agent
 */
async function registerSubAgentTask(agentName, taskTitle, description) {
  try {
    const { stdout } = await execPromise(
      `cd ${DASHBOARD_BACKEND} && node agentCli.js start ${agentName} "${taskTitle.replace(/"/g, '\\"')}" "${description.replace(/"/g, '\\"')}"`
    );
    
    const result = JSON.parse(stdout);
    
    // Update agent status to active
    await updateAgentStatus(agentName, 'active');
    
    return result.taskId;
  } catch (error) {
    console.error('Failed to register task:', error.message);
    return null;
  }
}

/**
 * Log completion of a sub-agent task
 */
async function logSubAgentCompletion(agentName, taskId, taskTitle, result, outputFile = null, outputType = null) {
  try {
    // Build command with optional output file
    let cmd = `cd ${DASHBOARD_BACKEND} && node agentCli.js complete ${agentName} ${taskId} "${taskTitle.replace(/"/g, '\\"')}" "${result.replace(/"/g, '\\"')}"`;
    
    if (outputFile) {
      cmd += ` "${outputFile}"`;
    }
    
    if (outputType) {
      cmd += ` "${outputType}"`;
    }
    
    await execPromise(cmd);
    
    // Update agent status to idle
    await updateAgentStatus(agentName, 'idle');
    
    return true;
  } catch (error) {
    console.error('Failed to log completion:', error.message);
    return false;
  }
}

/**
 * Update agent status in database
 */
async function updateAgentStatus(agentName, status) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.db.collection('agents').updateOne(
      { name: agentName },
      { $set: { status: status, lastActive: new Date() } },
      { upsert: true }
    );
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('Failed to update agent status:', error.message);
    return false;
  }
}

/**
 * Check for unlogged completed sub-agent tasks
 */
async function checkUnloggedCompletions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find tasks that are active but created by main session (not by agent)
    const unlogged = await mongoose.connection.db.collection('tasks').find({
      status: 'active',
      agentName: null
    }).toArray();
    
    await mongoose.connection.close();
    return unlogged;
  } catch (error) {
    console.error('Failed to check unlogged completions:', error.message);
    return [];
  }
}

/**
 * Get recent sub-agent session results
 */
async function getRecentSubAgentResults() {
  // This would need to call OpenClaw's subagent API
  // For now, return empty
  return [];
}

module.exports = {
  registerSubAgentTask,
  logSubAgentCompletion,
  updateAgentStatus,
  checkUnloggedCompletions
};
