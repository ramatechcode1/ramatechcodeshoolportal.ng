const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    // Internal reference we generate and send to Flutterwave as tx_ref
    reference: { type: String, required: true, unique: true },
    // Flutterwave's own transaction id, filled in after verification
    flwTransactionId: { type: String, default: null },
    amount: { type: Number, required: true }, // any amount, not tied to a fixed fee
    currency: { type: String, default: 'NGN' },
    coversStudents: { type: Number, default: null }, // optional note: how many students this covers
    monthFor: { type: String, default: null }, // e.g. "2026-08" - which month this payment is for
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending'
    },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
