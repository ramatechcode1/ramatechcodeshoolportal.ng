const express = require('express');
const School = require('../models/School');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/schools/me — the logged-in school's own profile + quick stats
router.get('/me', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const school = await School.findById(req.user.id).select('-password');
    if (!school) return res.status(404).json({ message: 'School not found.' });

    const totalStudents = await Student.countDocuments({ school: school._id, isActive: true });
    const totalPaid = await Payment.aggregate([
      { $match: { school: school._id, status: 'successful' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    res.json({
      school,
      stats: {
        totalStudents,
        totalRevenue: totalPaid[0]?.sum || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load school profile.' });
  }
});

// PATCH /api/schools/location — school shares its exact location (browser Geolocation API)
router.patch('/location', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
    }

    const school = await School.findByIdAndUpdate(
      req.user.id,
      { location: { lat, lng, accuracy: accuracy || null, sharedAt: new Date() } },
      { new: true }
    ).select('-password');

    res.json({ message: 'Location shared successfully.', school });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save location.' });
  }
});

// PATCH /api/schools/me — edit own school profile
router.patch('/me', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const { schoolName, contactName, phone, address, schoolType } = req.body;
    const school = await School.findByIdAndUpdate(
      req.user.id,
      { schoolName, contactName, phone, address, schoolType },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated.', school });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

module.exports = router;
