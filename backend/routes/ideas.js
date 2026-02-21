const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET all ideas
router.get('/', async (req, res) => {
  try {
    const ideas = await mongoose.connection.db
      .collection('ideas')
      .find({})
      .sort({ priority: -1, createdAt: -1 })
      .toArray();
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new idea
router.post('/', async (req, res) => {
  try {
    const idea = {
      ...req.body,
      createdAt: new Date(),
      status: req.body.status || 'idea'
    };
    const result = await mongoose.connection.db
      .collection('ideas')
      .insertOne(idea);
    res.json({ ...idea, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update idea
router.put('/:id', async (req, res) => {
  try {
    const result = await mongoose.connection.db
      .collection('ideas')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { $set: req.body }
      );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
