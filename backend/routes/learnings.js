const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Learning = require('../models/Learning');
const Log = require('../models/Log');
const { emitEvent } = require('../socket');

// Path to learnings folder (absolute path)
const LEARNINGS_PATH = process.env.LEARNINGS_PATH || '/home/aptest/.openclaw/workspace/learnings';

// Get all learnings from MD files
router.get('/files', async (req, res) => {
  try {
    if (!fs.existsSync(LEARNINGS_PATH)) {
      return res.json({ learnings: [], total: 0 });
    }
    
    const files = fs.readdirSync(LEARNINGS_PATH)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .sort()
      .reverse();
    
    const learnings = files.map(filename => {
      const filePath = path.join(LEARNINGS_PATH, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Parse frontmatter-like content
      const lines = content.split('\n');
      const title = lines[0]?.replace(/^#\s*/, '') || filename;
      
      // Extract category
      const categoryMatch = content.match(/\*\*Category:\*\*\s*(\w+)/);
      const category = categoryMatch ? categoryMatch[1] : 'general';
      
      // Extract date from filename
      const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      
      return {
        id: filename,
        title,
        category,
        date,
        filename,
        preview: content.slice(0, 200) + '...',
        content
      };
    });
    
    res.json({ learnings, total: learnings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single learning file
router.get('/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(LEARNINGS_PATH, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Learning file not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content, filename: req.params.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all learnings
router.get('/', async (req, res) => {
  try {
    const { agent, limit = 50, offset = 0 } = req.query;
    const filter = {};
    
    if (agent) filter.affectedAgents = agent;

    const learnings = await Learning.find(filter)
      .populate('triggerEventId')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Learning.countDocuments(filter);
    res.json({ learnings, total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single learning
router.get('/:id', async (req, res) => {
  try {
    const learning = await Learning.findById(req.params.id)
      .populate('triggerEventId');
    if (!learning) return res.status(404).json({ error: 'Learning not found' });
    res.json(learning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create learning
router.post('/', async (req, res) => {
  try {
    const learning = await Learning.create(req.body);
    
    // Log the learning
    const log = await Log.create({
      actor: 'core',
      action: 'LEARNING_COMMITTED',
      reasoningSummary: learning.description,
      metadata: { learningId: learning._id, confidence: learning.confidenceScore }
    });
    
    emitEvent('LEARNING_COMMITTED', learning);
    emitEvent('LOG_CREATED', log);
    
    res.status(201).json(learning);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update learning
router.put('/:id', async (req, res) => {
  try {
    const learning = await Learning.findById(req.params.id);
    if (!learning) return res.status(404).json({ error: 'Learning not found' });
    
    Object.assign(learning, req.body);
    learning.version += 1;
    await learning.save();
    
    emitEvent('LEARNING_UPDATED', learning);
    res.json(learning);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete learning
router.delete('/:id', async (req, res) => {
  try {
    const learning = await Learning.findByIdAndDelete(req.params.id);
    if (!learning) return res.status(404).json({ error: 'Learning not found' });
    
    emitEvent('LEARNING_DELETED', learning);
    res.json({ message: 'Learning deleted', learning });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
