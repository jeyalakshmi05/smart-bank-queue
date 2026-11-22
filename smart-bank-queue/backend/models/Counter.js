const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  counterNumber: { type: Number, required: true, unique: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  status: {
    type: String,
    enum: ["Available", "Busy", "Offline"],
    default: "Available"
  }
});

module.exports = mongoose.model("Counter", counterSchema);
