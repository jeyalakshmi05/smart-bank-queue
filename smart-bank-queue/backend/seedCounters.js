
const mongoose = require("mongoose");
require("dotenv").config();

const Counter = require("./models/Counter");
const Service = require("./models/Service");

async function seedCounters() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    
const counterData = [
  { counterNumber: 1, serviceName: "Cash Deposit" },
  { counterNumber: 2, serviceName: "Cash Withdrawal" },
  { counterNumber: 3, serviceName: "Account Opening" },
  { counterNumber: 4, serviceName: "Fund Transfer" },
  { counterNumber: 5, serviceName: "Loan Enquiry" },
  { counterNumber: 6, serviceName: "Passbook Update" }
];


    for (const item of counterData) {
      const service = await Service.findOne({
        name: item.serviceName
      });

      if (!service) {
        throw new Error(
          `Service not found: ${item.serviceName}`
        );
      }

      await Counter.findOneAndUpdate(
        { counterNumber: item.counterNumber },
        {
          counterNumber: item.counterNumber,
          services: [service._id],
          status: "Available"
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );
    }

    console.log("Bank counters added successfully!");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedCounters();
