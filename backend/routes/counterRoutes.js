const router = require("express").Router();
const Counter = require("../models/Counter");

router.post("/", async (req, res) => {
  try {
    const counter = await Counter.create(req.body);
    const populated = await counter.populate("services");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const counters = await Counter.find().populate("services").sort({ counterNumber: 1 });
    res.json(counters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const counter = await Counter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("services");
    if (!counter) return res.status(404).json({ message: "Counter not found" });
    res.json(counter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const counter = await Counter.findByIdAndDelete(req.params.id);
    if (!counter) return res.status(404).json({ message: "Counter not found" });
    res.json({ message: "Counter deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid counter id" });
  }
});

module.exports = router;
