const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { emitEvent } = require('../socket');

// Get all documents with filters
router.get('/', async (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (search) {
      filter.$text = { $search: search };
    }

    const documents = await Document.find(filter)
      .populate('linkedTaskIds', 'title status')
      .sort({ updatedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);
    res.json({ documents, total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('linkedTaskIds');
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create document
router.post('/', async (req, res) => {
  try {
    const doc = await Document.create(req.body);
    emitEvent('DOCUMENT_CREATED', doc);
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update document
router.put('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    // Increment version on update
    Object.assign(doc, req.body);
    doc.version += 1;
    doc.updatedAt = Date.now();
    await doc.save();
    
    emitEvent('DOCUMENT_UPDATED', doc);
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    emitEvent('DOCUMENT_DELETED', doc);
    res.json({ message: 'Document deleted', doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link task to document
router.post('/:id/link/:taskId', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    if (!doc.linkedTaskIds.includes(req.params.taskId)) {
      doc.linkedTaskIds.push(req.params.taskId);
      doc.updatedAt = Date.now();
      await doc.save();
    }
    
    emitEvent('DOCUMENT_UPDATED', doc);
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
