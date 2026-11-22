const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const customerRoutes = require("./routes/customerRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const counterRoutes = require("./routes/counterRoutes");
const userRoutes = require("./routes/userRoutes");
const queueRoutes = require("./routes/queueRoutes");
const authRoutes = require("./routes/authRoutes");
const {
  authMiddleware,
  adminOnly
} = require("./middleware/authMiddleware");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Smart Bank Queue Backend is running" });
});

app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/users", authMiddleware, adminOnly, userRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/auth", authRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
