#!/usr/bin/env node
/**
 * Agent CLI - Simple command-line interface for agent dashboard integration
 * 
 * Usage:
 *   node agentCli.js start <agentName> <taskTitle> <taskDescription>
 *   node agentCli.js progress <agentName> <taskId> <update>
 *   node agentCli.js complete <agentName> <taskId> <taskTitle> <result>
 *   node agentCli.js status <agentName>
 */

require('dotenv').config();
const {
  initializeAgentTask,
  updateTask,
  logActivity,
  finalizeAgentTask,
  getAgentStatus
} = require('./agentIntegration.js');

const [command, ...args] = process.argv.slice(2);

async function run() {
  try {
    switch (command) {
      case 'start': {
        const [agentName, taskTitle, taskDescription] = args;
        const result = await initializeAgentTask(agentName, taskTitle, taskDescription || taskTitle);
        console.log(JSON.stringify({
          taskId: result.task._id,
          agentStatus: result.agent.status,
          success: true
        }));
        break;
      }
      
      case 'progress': {
        const [agentName, taskId, update] = args;
        await updateTask(taskId, 'in_progress', { description: update });
        await logActivity('AGENT_PROGRESS', `${agentName}: ${update}`, { taskId });
        console.log(JSON.stringify({ taskId, status: 'in_progress', success: true }));
        break;
      }
      
      case 'complete': {
        const [agentName, taskId, taskTitle, result, outputFile, outputType] = args;
        const finalResult = await finalizeAgentTask(agentName, taskId, taskTitle, result || 'Task completed', true);
        
        // Update task with output file info
        const mongoose = require('mongoose');
        await mongoose.connection.db.collection('tasks').updateOne(
          { _id: new mongoose.Types.ObjectId(taskId) },
          { $set: { 
            outputFile: outputFile || null,
            outputType: outputType || null,
            agentName: agentName
          }}
        );
        
        console.log(JSON.stringify({
          taskId,
          agentStatus: finalResult.agent.status,
          outputFile: outputFile || null,
          success: true
        }));
        break;
      }
      
      case 'fail': {
        const [agentName, taskId, taskTitle, error] = args;
        const finalResult = await finalizeAgentTask(agentName, taskId, taskTitle, error || 'Task failed', false);
        console.log(JSON.stringify({
          taskId,
          agentStatus: finalResult.agent.status,
          success: false
        }));
        break;
      }
      
      case 'status': {
        const [agentName] = args;
        const status = await getAgentStatus(agentName);
        console.log(JSON.stringify(status, null, 2));
        break;
      }
      
      default:
        console.log(`Usage:
  node agentCli.js start <agentName> <taskTitle> <taskDescription>
  node agentCli.js progress <agentName> <taskId> <update>
  node agentCli.js complete <agentName> <taskId> <taskTitle> <result>
  node agentCli.js fail <agentName> <taskId> <taskTitle> <error>
  node agentCli.js status <agentName>

Agents: researcher, devops, comms`);
        process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ error: error.message, success: false }));
    process.exit(1);
  }
}

run();
