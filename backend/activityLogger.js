#!/usr/bin/env node
/**
 * Anukar Activity Logger
 * Logs tasks, updates state, and broadcasts to dashboard
 * 
 * Usage:
 *   node activityLogger.js start "Task title" "Description"
 *   node activityLogger.js progress "Task ID" "Progress update"
 *   node activityLogger.js complete "Task ID" "Result"
 *   node activityLogger.js block "Task ID" "Reason"
 *   node activityLogger.js fail "Task ID" "Error"
 *   node activityLogger.js state "mode" "decision" "confidence"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Log = require('./models/Log');
const SystemState = require('./models/SystemState');

const MONGODB_URI = process.env.MONGODB_URI;

async function connect() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

async function broadcast(event, data) {
  const http = require('http');
  const postData = JSON.stringify({ event, data });
  
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/internal/broadcast',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 1000
    }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', resolve);
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.write(postData);
    req.end();
  });
}

async function updateState(mode, decision, confidence = 50, activeTaskId = null) {
  const update = {
    currentMode: mode,
    coreDecision: decision,
    confidence: parseInt(confidence),
    updatedAt: new Date()
  };
  if (activeTaskId) update.activeTaskId = activeTaskId;
  
  const state = await mongoose.connection.db.collection('systemstates').findOneAndUpdate(
    { _id: 'system_state' },
    { $set: update },
    { returnDocument: 'after' }
  );
  
  await broadcast('SYSTEM_STATE_CHANGED', state.value);
  return state.value;
}

// Commands
async function startTask(title, description, source = 'core') {
  await connect();
  
  const task = await Task.create({
    title,
    description: description || '',
    status: 'active',
    source,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const log = await Log.create({
    actor: 'core',
    action: 'TASK_STARTED',
    taskId: task._id,
    reasoningSummary: `Started: ${title}`
  });
  
  await updateState('executing', title, 50, task._id);
  await broadcast('TASK_CREATED', task);
  await broadcast('LOG_CREATED', log);
  
  console.log(JSON.stringify({ taskId: task._id, status: 'started', title }));
  return task;
}

async function progressTask(taskId, update) {
  await connect();
  
  const task = await Task.findByIdAndUpdate(
    taskId,
    { 
      $push: { progressUpdates: { text: update, time: new Date() } },
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!task) {
    console.log(JSON.stringify({ error: 'Task not found' }));
    return;
  }
  
  const log = await Log.create({
    actor: 'core',
    action: 'TASK_PROGRESS',
    taskId: task._id,
    reasoningSummary: update
  });
  
  await broadcast('TASK_UPDATED', task);
  await broadcast('LOG_CREATED', log);
  
  console.log(JSON.stringify({ taskId: task._id, status: 'progress', update }));
  return task;
}

async function completeTask(taskId, result) {
  await connect();
  
  const task = await Task.findByIdAndUpdate(
    taskId,
    { 
      status: 'completed',
      result: result,
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!task) {
    console.log(JSON.stringify({ error: 'Task not found' }));
    return;
  }
  
  const log = await Log.create({
    actor: 'core',
    action: 'TASK_COMPLETED',
    taskId: task._id,
    reasoningSummary: result || `Completed: ${task.title}`
  });
  
  await updateState('idle', 'Task completed, awaiting next instruction', 90, null);
  await broadcast('TASK_STATUS_CHANGED', task);
  await broadcast('LOG_CREATED', log);
  
  console.log(JSON.stringify({ taskId: task._id, status: 'completed', result }));
  return task;
}

async function blockTask(taskId, reason) {
  await connect();
  
  const task = await Task.findByIdAndUpdate(
    taskId,
    { status: 'blocked', blockedReason: reason, updatedAt: new Date() },
    { new: true }
  );
  
  if (!task) {
    console.log(JSON.stringify({ error: 'Task not found' }));
    return;
  }
  
  const log = await Log.create({
    actor: 'core',
    action: 'TASK_BLOCKED',
    taskId: task._id,
    reasoningSummary: reason
  });
  
  await updateState('blocked', reason, 30, task._id);
  await broadcast('TASK_STATUS_CHANGED', task);
  await broadcast('LOG_CREATED', log);
  
  console.log(JSON.stringify({ taskId: task._id, status: 'blocked', reason }));
  return task;
}

async function failTask(taskId, error) {
  await connect();
  
  const task = await Task.findByIdAndUpdate(
    taskId,
    { status: 'failed', error: error, updatedAt: new Date() },
    { new: true }
  );
  
  if (!task) {
    console.log(JSON.stringify({ error: 'Task not found' }));
    return;
  }
  
  const log = await Log.create({
    actor: 'core',
    action: 'TASK_FAILED',
    taskId: task._id,
    reasoningSummary: error
  });
  
  await updateState('idle', `Task failed: ${error}`, 20, null);
  await broadcast('TASK_STATUS_CHANGED', task);
  await broadcast('LOG_CREATED', log);
  
  console.log(JSON.stringify({ taskId: task._id, status: 'failed', error }));
  return task;
}

async function setState(mode, decision, confidence) {
  await connect();
  const state = await updateState(mode, decision, confidence);
  console.log(JSON.stringify({ state: 'updated', mode, decision, confidence }));
  return state;
}

// CLI
const [command, ...args] = process.argv.slice(2);

(async () => {
  try {
    switch (command) {
      case 'start':
        await startTask(args[0], args[1], args[2] || 'core');
        break;
      case 'progress':
        await progressTask(args[0], args[1]);
        break;
      case 'complete':
        await completeTask(args[0], args[1]);
        break;
      case 'block':
        await blockTask(args[0], args[1]);
        break;
      case 'fail':
        await failTask(args[0], args[1]);
        break;
      case 'state':
        await setState(args[0], args[1], args[2] || 50);
        break;
      default:
        console.log(`Usage:
  node activityLogger.js start "Task title" "Description"
  node activityLogger.js progress "Task ID" "Update"
  node activityLogger.js complete "Task ID" "Result"
  node activityLogger.js block "Task ID" "Reason"
  node activityLogger.js fail "Task ID" "Error"
  node activityLogger.js state "mode" "decision" "confidence"`);
    }
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
})();
