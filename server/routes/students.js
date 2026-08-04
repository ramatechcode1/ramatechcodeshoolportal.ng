const express = require('express');
const Student = require('../models/Student');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes here are for a logged-in school managing its own students
router.use(requireAuth, requireRole('school'));

// GET /api/students — list all of this school's students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ school: req.user.id }).sort({ createdAt: -1 });
    res.json({ students, total: students.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load students.' });
  }
});

// POST /api/students — add a student interested in the programme
router.post('/', async (req, res) => {
  try {
    const { fullName, className, parentPhone, parentEmail, interestedCourse } = req.body;
    if (!fullName) return res.status(400).json({ message: 'Student full name is required.' });

    const student = await Student.create({
      school: req.user.id,
      fullName,
      className,
      parentPhone,
      parentEmail,
      interestedCourse
    });

    res.status(201).json({ message: 'Student added.', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add student.' });
  }
});

// PATCH /api/students/:id — edit a student
router.patch('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, school: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student updated.', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update student.' });
  }
});

// DELETE /api/students/:id — remove a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, school: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove student.' });
  }
});

module.exports = router;
