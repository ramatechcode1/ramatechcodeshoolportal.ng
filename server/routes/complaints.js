const express = require('express');
const Complaint = require('../models/Complaint');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/complaints — school files a complaint
router.post('/', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Please provide a subject and message.' });
    }
    const complaint = await Complaint.create({ school: req.user.id, subject, message });
    res.status(201).json({ message: 'Complaint submitted. Our team will respond soon.', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not submit complaint.' });
  }
});

// GET /api/complaints — school views its own complaints
router.get('/', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ school: req.user.id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load complaints.' });
  }
});

module.exports = router;
