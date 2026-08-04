const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    fullName: { type: String, required: true, trim: true },
    className: { type: String, trim: true }, // e.g. "JSS2", "Primary 4"
    parentPhone: { type: String, trim: true },
    parentEmail: { type: String, trim: true, lowercase: true },
    interestedCourse: { type: String, trim: true }, // e.g. "Robotics", "Python"
    isActive: { type: Boolean, default: true }, // interested & currently enrolled
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
