#!/usr/bin/env node
/**
 * Anukar State Reporter
 * Updates the dashboard with my current state
 * 
 * Usage: node stateReporter.js <mode> <decision> <confidence>
 * 
 * Modes: idle, executing, blocked, learning
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anukar-dashboard';

async function updateState(mode, decision, confidence = 50) {
  await mongoose.connect(MONGODB_URI);
  
  const state = await mongoose.connection.db.collection('systemstates').findOneAndUpdate(
    { _id: 'system_state' },
    {
      $set: {
        currentMode: mode,
        coreDecision: decision,
        confidence: parseInt(confidence),
        updatedAt: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  
  // Emit via socket (if server is running)
  const http = require('http');
  const postData = JSON.stringify({ event: 'SYSTEM_STATE_CHANGED', data: state.value });
  
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/internal/broadcast',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, () => process.exit(0));
  
  req.on('error', () => process.exit(0)); // Silent fail if no server
  req.write(postData);
  req.end();
  
  console.log(`[State] ${mode}: ${decision} (${confidence}%)`);
}

const [mode, decision, confidence] = process.argv.slice(2);
if (!mode || !decision) {
  console.log('Usage: node stateReporter.js <mode> <decision> [confidence]');
  console.log('Modes: idle, executing, blocked, learning');
  process.exit(1);
}

updateState(mode, decision, confidence || 50);
