const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const School = require('../models/School');
const Admin = require('../models/Admin');

const router = express.Router();

function signToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// POST /api/auth/register  — a school signs up for the partnership portal
router.post('/register', async (req, res) => {
  try {
    const { schoolName, contactName, email, phone, password, address, schoolType } = req.body;

    if (!schoolName || !contactName || !email || !phone || !password || !address) {
      return res.status(400).json({ message: 'Please fill in every required field.' });
    }

    const existing = await School.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A school is already registered with this email.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const school = await School.create({
      schoolName,
      contactName,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      address,
      schoolType
    });

    const token = signToken(school._id, 'school');

    res.status(201).json({
      message: 'Registration submitted. Your school portal is ready.',
      token,
      school: {
        id: school._id,
        schoolName: school.schoolName,
        email: school.email,
        status: school.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while registering the school.' });
  }
});

// POST /api/auth/login — school login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const school = await School.findOne({ email: (email || '').toLowerCase() });

    if (!school || !(await bcrypt.compare(password, school.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = signToken(school._id, 'school');
    res.json({
      token,
      school: {
        id: school._id,
        schoolName: school.schoolName,
        email: school.email,
        status: school.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: (email || '').toLowerCase() });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = signToken(admin._id, 'admin');
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
});

module.exports = router;
