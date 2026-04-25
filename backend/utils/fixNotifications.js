const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../model/user");
const Notification = require("../model/Notification");
const connectDB = require("../config/database");

const fixNotifications = async () => {
  try {
    await connectDB();
    console.log("Connected to database.");

    // Find all admins
    const admins = await User.find({ role: "admin" });
    if (admins.length === 0) {
      console.log("No admins found.");
      return;
    }

    // Find all pending users who don't have a "new_user" notification
    const pendingUsers = await User.find({ 
      status: "pending", 
      role: { $in: ["company", "vendor"] },
      isDeleted: false 
    });

    console.log(`Found ${pendingUsers.length} pending users.`);

    let createdCount = 0;

    for (const user of pendingUsers) {
      // Check if notification already exists for any admin regarding this user
      const existing = await Notification.findOne({
        type: "new_user",
        "data.userId": user._id
      });

      if (!existing) {
        for (const admin of admins) {
          await Notification.create({
            recipientId: admin._id,
            senderId: user._id,
            type: "new_user",
            title: "New Registration Pending (Recovered)",
            message: `New ${user.role} "${user.fullName || user.username}" has registered and needs approval.`,
            data: { userId: user._id, role: user.role, recovered: true },
            priority: "medium",
            relatedId: user._id,
            relatedModel: "User"
          });
        }
        createdCount++;
        console.log(`Created notification for user: ${user.email}`);
      }
    }

    console.log(`Successfully recovered ${createdCount} missing notifications.`);
    process.exit(0);
  } catch (error) {
    console.error("Error fixing notifications:", error);
    process.exit(1);
  }
};

fixNotifications();
