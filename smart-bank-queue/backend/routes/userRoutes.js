
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Counter = require("../models/Counter");

// Create Admin or Staff account
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, counter } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    let assignedCounter = null;

    if (role === "Staff") {
      if (!counter) {
        return res.status(400).json({
          message: "Please assign a counter to the staff member"
        });
      }

      assignedCounter = await Counter.findById(counter);

      if (!assignedCounter) {
        return res.status(404).json({
          message: "Counter not found"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Staff",
      counter: assignedCounter ? assignedCounter._id : null
    });

    const result = await User.findById(user._id)
      .select("-password")
      .populate("counter");

    res.status(201).json(result);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("counter")
      .sort({ name: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Update user and counter assignment
router.put("/:id", async (req, res) => {
  try {
    const { name, email, role, password, counter } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must contain at least 6 characters"
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role === "Staff" || counter !== undefined) {
      if (!counter) {
        return res.status(400).json({
          message: "Please assign a counter to the staff member"
        });
      }

      const assignedCounter = await Counter.findById(counter);

      if (!assignedCounter) {
        return res.status(404).json({
          message: "Counter not found"
        });
      }

      updateData.counter = assignedCounter._id;
    }

    if (role === "Admin") {
      updateData.counter = null;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("counter");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({ message: "User deleted" });

  } catch (err) {
    res.status(400).json({
      message: "Invalid user id"
    });
  }
});

// Reset Staff Password (Admin only)
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must contain at least 6 characters"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Staff account not found"
      });
    }

    if (user.role !== "Staff") {
      return res.status(400).json({
        message: "Password reset is only available for Staff accounts"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Staff password reset successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
