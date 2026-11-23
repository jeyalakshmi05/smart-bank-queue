
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error("Admin details are missing in .env");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "Admin",
        counter: null
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log("Admin account created successfully!");
    console.log("Admin email:", email);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
