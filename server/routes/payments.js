const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const Payment = require('../models/Payment');
const School = require('../models/School');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/payments/initiate — school starts a payment of ANY amount, not tied to a fixed fee
router.post('/initiate', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const { amount, coversStudents, monthFor, note } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount greater than zero.' });
    }

    const school = await School.findById(req.user.id);
    if (!school) return res.status(404).json({ message: 'School not found.' });

    // Our own internal reference — this is what gets shown to the school after success
    const reference = `RTC-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const payment = await Payment.create({
      school: school._id,
      reference,
      amount: numericAmount,
      coversStudents: coversStudents || null,
      monthFor: monthFor || null,
      note: note || '',
      status: 'pending'
    });

    // The frontend uses FLW inline checkout with this reference + the public key.
    res.status(201).json({
      message: 'Payment initialized.',
      reference,
      amount: numericAmount,
      publicKey: process.env.FLW_PUBLIC_KEY,
      customer: {
        email: school.email,
        phone_number: school.phone,
        name: school.contactName
      },
      customizations: {
        title: 'Ramatechcode Lab & Tech',
        description: `Monthly tech programme payment — ${school.schoolName}`,
        logo: ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not initialize payment.' });
  }
});

// POST /api/payments/verify — called by the frontend right after Flutterwave returns success
// This re-checks the transaction with Flutterwave's servers before trusting it (never trust the client alone).
router.post('/verify', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const { transaction_id, reference } = req.body;
    if (!transaction_id || !reference) {
      return res.status(400).json({ message: 'Missing transaction details.' });
    }

    const payment = await Payment.findOne({ reference, school: req.user.id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found.' });

    const flwRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );
    const flwData = await flwRes.json();

    const isValid =
      flwData?.status === 'success' &&
      flwData?.data?.status === 'successful' &&
      flwData?.data?.tx_ref === reference &&
      Number(flwData?.data?.amount) >= payment.amount &&
      flwData?.data?.currency === 'NGN';

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Payment could not be verified.', payment });
    }

    payment.status = 'successful';
    payment.flwTransactionId = String(transaction_id);
    payment.paidAt = new Date();
    await payment.save();

    res.json({ message: 'Payment verified successfully.', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not verify payment.' });
  }
});

// POST /api/payments/webhook — Flutterwave server-to-server notification (backup to /verify)
// Configure this URL + a secret hash in your Flutterwave dashboard settings.
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== process.env.FLW_SECRET_HASH) {
      return res.status(401).end();
    }

    const event = req.body;
    const txRef = event?.data?.tx_ref;
    if (event?.data?.status === 'successful' && txRef) {
      const payment = await Payment.findOne({ reference: txRef });
      if (payment && payment.status !== 'successful') {
        payment.status = 'successful';
        payment.flwTransactionId = String(event.data.id);
        payment.paidAt = new Date();
        await payment.save();
      }
    }
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// GET /api/payments — a school's own payment history (with references)
router.get('/', requireAuth, requireRole('school'), async (req, res) => {
  try {
    const payments = await Payment.find({ school: req.user.id }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load payment history.' });
  }
});

module.exports = router;
