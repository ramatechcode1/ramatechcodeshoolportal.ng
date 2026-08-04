require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const Admin = require('./models/Admin');
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(morgan('dev'));

// Flutterwave webhook needs the raw-ish body handled inside its own route,
// so mount it before the global json parser touches everything else.
app.use('/api/payments/webhook', express.raw({ type: '*/*' }), (req, res, next) => {
  try {
    req.body = req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
  } catch {
    req.body = {};
  }
  next();
});

app.use(express.json());

// Basic rate limiting on auth endpoints to slow down brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Serve the frontend in /public — this makes http://localhost:5000/ load index.html,
// and http://localhost:5000/dashboard.html etc. load the other pages directly.
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Any GET that isn't an API route and doesn't match a static file falls back to
// the landing page instead of a bare 404 (e.g. someone visits a typo'd path).
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 5000;

async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await Admin.findOne({ email });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);
  await Admin.create({ name: 'Ramatechcode Admin', email, password: hashed });
  console.log(`Admin account created for ${email}. Change the password after first login.`);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await bootstrapAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
