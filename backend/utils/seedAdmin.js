const User = require("../model/user");

const seedDemoAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminFirebaseUid = process.env.ADMIN_FIREBASE_UID;

  if (!adminEmail || !adminFirebaseUid) {
    if (process.env.NODE_ENV === "production") {
      console.warn("ADMIN_EMAIL or ADMIN_FIREBASE_UID not set - skipping admin seed/update in production.");
      return { created: false, user: null };
    }
    console.warn("Admin Firebase configuration missing in .env - admin account not created/updated.");
    return { created: false, user: null };
  }

  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    existingAdmin.email = adminEmail;
    existingAdmin.firebaseUid = adminFirebaseUid;
    await existingAdmin.save();
    return { created: false, updated: true, user: existingAdmin };
  }

  // Create new admin if none exists
  const adminUser = await User.create({
    firebaseUid: adminFirebaseUid,
    email: adminEmail,
    authProvider: "firebase",
    role: "admin",
    status: "approved",
    profileCompleted: true,
    onboardingStep: 5,
    selectedPlan: "free",
  });

  return { created: true, updated: false, user: adminUser };
};

module.exports = { seedDemoAdmin };
