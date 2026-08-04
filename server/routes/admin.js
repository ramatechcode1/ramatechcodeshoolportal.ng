const express = require('express');
const School = require('../models/School');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// GET /api/admin/overview — top-level numbers for the admin dashboard
router.get('/overview', async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalComplaintsOpen = await Complaint.countDocuments({ status: 'open' });
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'successful' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    res.json({
      totalSchools,
      totalStudents,
      totalComplaintsOpen,
      totalRevenue: revenueAgg[0]?.sum || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load overview.' });
  }
});

// GET /api/admin/schools — every school, with student counts + revenue + location
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.find().select('-password').sort({ createdAt: -1 });

    const enriched = await Promise.all(
      schools.map(async (school) => {
        const totalStudents = await Student.countDocuments({ school: school._id, isActive: true });
        const revenueAgg = await Payment.aggregate([
          { $match: { school: school._id, status: 'successful' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } }
        ]);
        return {
          ...school.toObject(),
          totalStudents,
          totalRevenue: revenueAgg[0]?.sum || 0
        };
      })
    );

    res.json({ schools: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load schools.' });
  }
});

// PATCH /api/admin/schools/:id/status — approve or suspend a school
router.patch('/schools/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const school = await School.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!school) return res.status(404).json({ message: 'School not found.' });
    res.json({ message: `School marked as ${status}.`, school });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update school status.' });
  }
});

// GET /api/admin/payments — every payment across every school
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().populate('school', 'schoolName email').sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load payments.' });
  }
});

// GET /api/admin/complaints — every complaint across every school
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('school', 'schoolName email').sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load complaints.' });
  }
});

// PATCH /api/admin/complaints/:id — reply to / update status of a complaint
router.patch('/complaints/:id', async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, adminReply },
      { new: true }
    ).populate('school', 'schoolName email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ message: 'Complaint updated.', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update complaint.' });
  }
});

module.exports = router;
