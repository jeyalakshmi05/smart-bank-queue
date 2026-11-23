
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({

  tokenNumber: {
    type: String,
    required: true
  },

  sequence: {
    type: Number,
    required: true
  },

  dateKey: {
    type: String,
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },

  status: {
    type: String,
    enum: [
      "Waiting",
      "Called",
      "Serving",
      "On Hold",
      "Completed",
      "Skipped",
      "Cancelled",
      "No Show"
    ],
    default: "Waiting"
  },

  counter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Counter",
    default: null
  },

  priority: {
    type: Number,
    default: 3
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  calledAt: {
    type: Date,
    default: null
  },

  serviceStartedAt: {
    type: Date,
    default: null
  },

  completedAt: {
    type: Date,
    default: null
  },

  heldAt: {
    type: Date,
    default: null
  },

  recalledAt: {
    type: Date,
    default: null
  },

  transferredAt: {
    type: Date,
    default: null
  },

  transferredFromCounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Counter",
    default: null
  },

  noShowAt: {
    type: Date,
    default: null
  }

});

tokenSchema.index(
  { dateKey: 1, service: 1, sequence: 1 },
  { unique: true }
);

module.exports = mongoose.model("Token", tokenSchema);
