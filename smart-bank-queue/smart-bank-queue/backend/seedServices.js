
const mongoose = require("mongoose");
require("dotenv").config();

const Service = require("./models/Service");

const services = [
  {
    name: "Account Opening",
    prefix: "A",
    averageTime: 15,
    active: true
  },
  {
    name: "Cash Deposit",
    prefix: "D",
    averageTime: 5,
    active: true
  },
  {
    name: "Cash Withdrawal",
    prefix: "W",
    averageTime: 7,
    active: true
  },
  {
    name: "Fund Transfer",
    prefix: "F",
    averageTime: 10,
    active: true
  },
  {
    name: "Loan Enquiry",
    prefix: "L",
    averageTime: 12,
    active: true
  },
  {
    name: "Passbook Update",
    prefix: "P",
    averageTime: 5,
    active: true
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    for (const service of services) {
      await Service.findOneAndUpdate(
        { name: service.name },
        service,
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log("Bank services added successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedServices();
