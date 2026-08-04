const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    schoolType: {
      type: String,
      enum: ['Primary', 'Secondary', 'Primary & Secondary'],
      default: 'Primary & Secondary'
    },
    // Shared once via the browser Geolocation API on the school dashboard
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      sharedAt: { type: Date, default: null },
      accuracy: { type: Number, default: null }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending'
    },
    monthlyFeePerStudent: { type: Number, default: 3000 }, // Naira, editable per school
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('School', schoolSchema);
