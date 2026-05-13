const connectDB = require("./config/database");
const User = require("./model/user");
const mongoose = require("mongoose");

const checkAdmin = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const admin = await User.findOne({ email: "admin@vendorlink.com" }).select("+password");
    if (!admin) {
      console.log("Admin user not found");
    } else {
      console.log("Admin user found:");
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
      console.log("Status:", admin.status);
      console.log("Has password:", !!admin.password);
      
      const bcrypt = require("bcryptjs");
      const isMatch = await bcrypt.compare("Admin@0909", admin.password);
      console.log("Password 'Admin@0909' matches:", isMatch);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkAdmin();
