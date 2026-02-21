/**
 * Seed Specialist Agents
 * Run this script to initialize the 3 specialist agents in MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('./models/Agent');
const Log = require('./models/Log');

const specialistAgents = [
  {
    name: 'researcher',
    role: 'Intel & Deep Dives',
    type: 'specialist',
    status: 'idle',
    capabilities: [
      'web_research',
      'competitor_analysis',
      'market_research',
      'data_gathering',
      'trend_monitoring',
      'content_scraping',
      'summary_generation'
    ],
    tools: ['web_search', 'web_fetch', 'browser', 'image'],
    load: 0,
    performanceMetrics: {
      successRate: 0,
      avgExecutionTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    }
  },
  {
    name: 'devops',
    role: 'GitHub & Infrastructure',
    type: 'specialist',
    status: 'idle',
    capabilities: [
      'ci_monitoring',
      'repo_health_checks',
      'issue_triage',
      'pr_review',
      'deployment_tracking',
      'repo_cleanup',
      'build_monitoring'
    ],
    tools: ['exec', 'gh', 'git', 'browser'],
    load: 0,
    performanceMetrics: {
      successRate: 0,
      avgExecutionTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    }
  },
  {
    name: 'comms',
    role: 'Writing & Messaging',
    type: 'specialist',
    status: 'idle',
    capabilities: [
      'email_drafting',
      'social_media_posts',
      'documentation_writing',
      'messaging',
      'blog_posts',
      'summaries',
      'content_formatting'
    ],
    tools: ['message', 'write', 'gog', 'exec'],
    load: 0,
    performanceMetrics: {
      successRate: 0,
      avgExecutionTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    }
  }
];

async function seedAgents() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anukar-dashboard';
    await mongoose.connect(MONGODB_URI);
    console.log('[MongoDB] Connected');

    console.log('\n📦 Seeding specialist agents...\n');

    const created = [];
    const existing = [];

    for (const agentData of specialistAgents) {
      // Check if agent already exists
      const existingAgent = await Agent.findOne({ name: agentData.name });

      if (existingAgent) {
        console.log(`✓ Agent "${agentData.name}" already exists`);
        existing.push(existingAgent);
      } else {
        // Create new agent
        const agent = await Agent.create(agentData);
        console.log(`✓ Created agent "${agent.name}" (${agent.role})`);
        created.push(agent);

        // Create log entry
        await Log.create({
          actor: 'system',
          action: 'AGENT_CREATED',
          reasoningSummary: `Specialist agent "${agent.name}" initialized via seed script`,
          metadata: { 
            agentId: agent._id, 
            type: agent.type,
            capabilities: agent.capabilities 
          }
        });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created.length}`);
    console.log(`   Existing: ${existing.length}`);
    console.log(`   Total: ${created.length + existing.length}\n`);

    if (created.length > 0) {
      console.log('✅ Seeding complete!\n');
    } else {
      console.log('ℹ️  All agents already exist. No new agents created.\n');
    }

    // Display agents
    const allAgents = await Agent.find({ type: 'specialist' });
    console.log('📋 Current specialist agents:');
    allAgents.forEach(agent => {
      console.log(`   ${agent.name} - ${agent.role} [${agent.status}]`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agents:', error);
    process.exit(1);
  }
}

// Run seed function
seedAgents();
