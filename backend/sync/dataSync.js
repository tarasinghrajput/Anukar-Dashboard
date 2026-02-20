#!/usr/bin/env node
/**
 * Data Sync Service
 * Syncs tasks from GitHub Issues and Google Sheets to MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { execSync } = require('child_process');
const Task = require('../models/Task');
const Log = require('../models/Log');

// Status mapping
const STATUS_MAP = {
  // GitHub states
  'OPEN': 'active',
  'CLOSED': 'completed',
  // Sheet statuses
  'New': 'queued',
  'In Progress': 'active',
  'Completed': 'completed',
  'Under Review': 'active',
  'Blocked': 'blocked',
  'Testing': 'active'
};

// Priority mapping (for metadata)
const PRIORITY_MAP = {
  'Critical': 'P0',
  'High': 'P1',
  'Medium': 'P2',
  'Low': 'P3'
};

/**
 * Fetch GitHub issues using gh CLI
 */
async function fetchGitHubIssues(repo) {
  try {
    const result = execSync(
      `gh issue list --repo ${repo} --limit 100 --json number,title,state,labels,body,createdAt,updatedAt,closedAt,url`,
      { encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('[GitHub] Error fetching issues:', error.message);
    return [];
  }
}

/**
 * Fetch Google Sheet data using gog CLI
 */
async function fetchSheetData(sheetId) {
  try {
    const result = execSync(
      `gog sheets get ${sheetId} "Sheet1!A2:Z" --json --no-input`,
      { encoding: 'utf-8' }
    );
    const data = JSON.parse(result);
    return data.values || [];
  } catch (error) {
    console.error('[Sheets] Error fetching data:', error.message);
    return [];
  }
}

/**
 * Parse GitHub issue labels
 */
function parseLabels(labels) {
  const result = { priority: 'P2', type: 'issue' };
  for (const label of labels) {
    const name = label.name || label;
    if (['P0', 'P1', 'P2', 'P3'].includes(name)) {
      result.priority = name;
    } else if (name === 'bug') {
      result.type = 'issue';
    } else if (name === 'enhancement') {
      result.type = 'feature';
    }
  }
  return result;
}

/**
 * Sync GitHub issues to MongoDB
 */
async function syncGitHubIssues() {
  const repo = process.env.GITHUB_REPO || 'tarasinghrajput/Task-Tracker';
  console.log(`\n[GitHub] Fetching issues from ${repo}...`);
  
  const issues = await fetchGitHubIssues(repo);
  console.log(`[GitHub] Found ${issues.length} issues`);
  
  let created = 0, updated = 0;
  
  for (const issue of issues) {
    const { priority, type } = parseLabels(issue.labels || []);
    const status = STATUS_MAP[issue.state] || 'queued';
    
    // Check if task exists by GitHub issue number (stored in metadata)
    const existingTask = await Task.findOne({
      'metadata.githubIssueNumber': issue.number
    });
    
    const taskData = {
      title: issue.title,
      description: issue.body || '',
      status,
      source: 'human',
      assignedTo: 'tarasinghrajput7261@gmail.com',
      metadata: {
        githubIssueNumber: issue.number,
        githubUrl: issue.url,
        priority,
        type,
        source: 'github'
      },
      updatedAt: new Date(issue.updatedAt)
    };
    
    if (existingTask) {
      await Task.findByIdAndUpdate(existingTask._id, {
        ...taskData,
        updatedAt: new Date()
      });
      updated++;
    } else {
      taskData.createdAt = new Date(issue.createdAt);
      await Task.create(taskData);
      created++;
    }
  }
  
  console.log(`[GitHub] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

/**
 * Sync Google Sheet rows to MongoDB
 */
async function syncSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.log('[Sheets] No GOOGLE_SHEET_ID configured, skipping');
    return { created: 0, updated: 0 };
  }
  
  console.log(`\n[Sheets] Fetching data from sheet ${sheetId}...`);
  
  const rows = await fetchSheetData(sheetId);
  console.log(`[Sheets] Found ${rows.length} rows`);
  
  let created = 0, updated = 0;
  
  // Column indices based on schema
  const COL = {
    TASK_ID: 0,
    DESCRIPTION: 1,
    REPORTER: 2,
    DATE_SUBMITTED: 3,
    STATUS: 4,
    TASK_TYPE: 5,
    PRIORITY: 6,
    ASSIGNED_TO: 7,
    RESOLUTION_NOTES: 8,
    RESOLUTION_DATE: 9,
    TOOK_HELP: 10
  };
  
  for (const row of rows) {
    if (!row[COL.TASK_ID]) continue; // Skip empty rows
    
    const taskId = row[COL.TASK_ID];
    const status = STATUS_MAP[row[COL.STATUS]] || 'queued';
    const priority = PRIORITY_MAP[row[COL.PRIORITY]] || 'P2';
    
    // Parse date (DD/MM/YYYY)
    let createdAt = new Date();
    if (row[COL.DATE_SUBMITTED]) {
      const [day, month, year] = row[COL.DATE_SUBMITTED].split('/');
      if (day && month && year) {
        createdAt = new Date(`${year}-${month}-${day}`);
      }
    }
    
    // Check if task exists by sheet Task ID
    const existingTask = await Task.findOne({
      'metadata.sheetTaskId': taskId
    });
    
    const taskData = {
      title: row[COL.DESCRIPTION] || 'Untitled Task',
      description: row[COL.RESOLUTION_NOTES] || '',
      status,
      source: 'human',
      assignedTo: row[COL.ASSIGNED_TO] || 'tarasinghrajput7261@gmail.com',
      metadata: {
        sheetTaskId: taskId,
        reporter: row[COL.REPORTER],
        taskType: row[COL.TASK_TYPE],
        priority,
        tookHelpFromRoshan: row[COL.TOOK_HELP],
        source: 'sheet'
      },
      createdAt,
      updatedAt: new Date()
    };
    
    if (existingTask) {
      await Task.findByIdAndUpdate(existingTask._id, taskData);
      updated++;
    } else {
      await Task.create(taskData);
      created++;
    }
  }
  
  console.log(`[Sheets] Created: ${created}, Updated: ${updated}`);
  return { created, updated };
}

/**
 * Main sync function
 */
async function sync() {
  console.log('═══════════════════════════════════════════');
  console.log('  Anukar Dashboard - Data Sync Service');
  console.log('═══════════════════════════════════════════');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/anukar-dashboard';
  await mongoose.connect(mongoUri);
  console.log(`\n[MongoDB] Connected to ${mongoUri}`);
  
  try {
    // Update Task schema to support metadata field
    if (!Task.schema.path('metadata')) {
      Task.schema.add({
        metadata: { type: mongoose.Schema.Types.Mixed }
      });
    }
    
    const githubResult = await syncGitHubIssues();
    const sheetResult = await syncSheetData();
    
    // Create sync log
    await Log.create({
      actor: 'system',
      action: 'DATA_SYNC',
      reasoningSummary: `Synced data from GitHub (${githubResult.created + githubResult.updated} issues) and Sheets (${sheetResult.created + sheetResult.updated} rows)`,
      metadata: { github: githubResult, sheets: sheetResult }
    });
    
    console.log('\n✅ Sync completed successfully!');
    console.log(`   GitHub: ${githubResult.created} created, ${githubResult.updated} updated`);
    console.log(`   Sheets: ${sheetResult.created} created, ${sheetResult.updated} updated`);
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n[MongoDB] Disconnected');
  }
}

// Run sync
sync().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
