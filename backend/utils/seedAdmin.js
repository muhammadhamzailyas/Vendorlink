const User = require("../model/user");

/**
 * Seeds or synchronizes the system administrator account.
 * This replaces the legacy Firebase-based admin seeding.
 */
const seedDemoAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("[Seed] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.");
    return { created: false, user: null };
  }

  try {
    let admin = await User.findOne({ role: "admin" });

    if (admin) {
      console.log(`[Seed] Syncing existing admin account: ${adminEmail}`);
      admin.email = adminEmail.toLowerCase();
      admin.password = adminPassword; // Pre-save hook will hash this if modified
      admin.authProvider = "local";
      admin.emailVerified = true;
      admin.status = "approved";
      await admin.save();
      return { created: false, updated: true, user: admin };
    }

    console.log(`[Seed] Creating new admin account: ${adminEmail}`);
    
    admin = await User.create({
      fullName: "System Administrator",
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      authProvider: "local",
      role: "admin",
      status: "approved",
      emailVerified: true,
      profileCompleted: true,
      onboardingStep: 5,
      selectedPlan: "enterprise",
    });

    return { created: true, updated: false, user: admin };
  } catch (error) {
    console.error("[Seed] Admin seeding failed:", error);
    return { created: false, error };
  }
};

module.exports = { seedDemoAdmin };
