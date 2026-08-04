const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open'
    },
    adminReply: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
