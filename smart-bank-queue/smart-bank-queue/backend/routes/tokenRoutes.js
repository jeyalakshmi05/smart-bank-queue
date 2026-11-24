const router = require("express").Router();

const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Token = require("../models/Token");
const { authMiddleware } = require("../middleware/authMiddleware");

function dateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// =====================================================
// PUBLIC ROUTES (customer pages use these, no login)
// =====================================================

// Customer: generate token
router.post("/generate", async (req, res) => {
  try {
    const { name, mobile, serviceId, priority = 3 } = req.body;
    if (!name || !mobile || !serviceId) {
      return res.status(400).json({ message: "Name, mobile and service are required" });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ message: "Service not found or inactive" });
    }

    const customer = await Customer.create({ name, mobile });
    const today = dateKey();

    const last = await Token.findOne({ service: service._id, dateKey: today }).sort({ sequence: -1 });
    const sequence = last ? last.sequence + 1 : 1;
    const tokenNumber = `${service.prefix}${String(sequence).padStart(3, "0")}`;

    const token = await Token.create({
      tokenNumber,
      sequence,
      dateKey: today,
      customer: customer._id,
      service: service._id,
      priority: Number(priority) || 3
    });

    const result = await Token.findById(token._id)
      .populate("customer", "name mobile")
      .populate("service", "name prefix averageTime");

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Customer: track token with queue position and estimated wait
router.get("/:id/track", async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate("customer", "name")
      .populate("service", "name averageTime")
      .populate("counter", "counterNumber");

    if (!token) return res.status(404).json({ message: "Token not found" });

    let ahead = 0;
    if (token.status === "Waiting") {
      ahead = await Token.countDocuments({
        status: "Waiting",
        service: token.service._id,
        dateKey: token.dateKey,
        $or: [
          { priority: { $lt: token.priority } },
          { priority: token.priority, createdAt: { $lt: token.createdAt } }
        ]
      });
    }

    res.json({
      tokenNumber: token.tokenNumber,
      status: token.status,
      service: token.service,
      counter: token.counter,
      customer: token.customer,
      ahead,
      estimatedWait: ahead * (token.service.averageTime || 0)
    });
  } catch (err) {
    res.status(400).json({ message: "Invalid token id" });
  }
});

// Customer: cancel own token (only while waiting)
router.put("/:id/cancel", async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) return res.status(404).json({ message: "Token not found" });

    if (token.status !== "Waiting") {
      return res.status(400).json({
        message: "Only waiting tokens can be cancelled"
      });
    }

    token.status = "Cancelled";
    await token.save();

    res.json({ message: "Token cancelled" });
  } catch (err) {
    res.status(400).json({ message: "Invalid token id" });
  }
});

// Customer: find today's active token by mobile number
router.get("/find/:mobile", async (req, res) => {
  try {
    const customers = await Customer.find({ mobile: req.params.mobile }).select("_id");

    const token = await Token.findOne({
      customer: { $in: customers.map(c => c._id) },
      dateKey: dateKey(),
      status: { $in: ["Waiting", "Called", "Serving", "On Hold"] }
    }).sort({ createdAt: -1 });

    if (!token) {
      return res.status(404).json({ message: "No active token found for this number" });
    }

    res.json({ id: token._id, tokenNumber: token.tokenNumber });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// =====================================================
// PROTECTED ROUTES (login required)
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tokens = await Token.find()
      .populate("customer", "name mobile")
      .populate("service", "name prefix averageTime")
      .populate("counter", "counterNumber")
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate("customer", "name mobile")
      .populate("service", "name prefix averageTime")
      .populate("counter", "counterNumber");
    if (!token) return res.status(404).json({ message: "Token not found" });
    res.json(token);
  } catch (err) {
    res.status(400).json({ message: "Invalid token id" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const token = await Token.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!token) return res.status(404).json({ message: "Token not found" });
    res.json(token);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const token = await Token.findByIdAndDelete(req.params.id);
    if (!token) return res.status(404).json({ message: "Token not found" });
    res.json({ message: "Token deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid token id" });
  }
});

module.exports = router;