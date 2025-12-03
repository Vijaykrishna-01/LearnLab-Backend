// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentIntentId: {
    type: String,
    sparse: true
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  }],
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "expired", "refunded"],
    default: "pending",
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String
  }
});

// Index for efficient queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Expire pending payments after 1 hour
paymentSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 3600,
  partialFilterExpression: { status: "pending" }
});

module.exports = mongoose.model("Payment", paymentSchema);