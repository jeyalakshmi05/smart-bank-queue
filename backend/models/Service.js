const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  prefix: { type: String, required: true, uppercase: true, trim: true },
  averageTime: { type: Number, default: 5, min: 1 },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model("Service", serviceSchema);
