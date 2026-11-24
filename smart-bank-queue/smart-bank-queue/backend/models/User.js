
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  role: {
    type: String,
    enum: ["Admin", "Staff"],
    default: "Staff"
  },

  password: {
    type: String,
    required: true
  },

  counter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Counter",
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
