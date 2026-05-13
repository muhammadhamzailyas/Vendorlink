const connectDB = require("./config/database");
const User = require("./model/user");
const mongoose = require("mongoose");

const listUsers = async () => {
  try {
    await connectDB();
    const users = await User.find({ role: { $ne: "admin" } }).select("+password");
    console.log(`Found ${users.length} non-admin users:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, Has Password: ${!!u.password}`);
    });
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

listUsers();
