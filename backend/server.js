const express = require("express");
const http = require("http");
const connectDB = require("./config/database");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { seedDemoAdmin } = require("./utils/seedAdmin");
const User = require("./model/user");
const Company = require("./model/company");
const Vendor = require("./model/vendor");
const Notification = require("./model/Notification");
const Task = require("./model/task");
const Proposal = require("./model/proposal");
const Contract = require("./model/Contract");
const Payment = require("./model/Payment");
const Transaction = require("./model/Transaction");
const Wallet = require("./model/Wallet");

// Services
const SocketService = require("./services/wsService");
const NotificationService = require("./services/notificationService");
const NotificationController = require("./controller/notificationController");
const passport = require("./config/passport");

dotenv.config();

const app = express();
const server = http.createServer(app);
const basePort = Number(process.env.PORT || 8002);

// Initialize Socket + Notification services
const socketService = new SocketService(server);
const notificationService = new NotificationService(socketService);

// Make services accessible from controllers via req.app.get(...)
app.set("socketService", socketService);
app.set("notificationService", notificationService);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(passport.initialize());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000, // Increased from 100 to 1000
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  })
);

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/forgot-password", authRateLimit);

// Stripe Webhook MUST be before express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  require("./controller/paymentController").handleWebhook.bind(require("./controller/paymentController"))
);

const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "5mb";
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

app.use("/documents", express.static(path.join(__dirname, "uploads")));

app.use("/api/admin", require("./routes/admin"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/onboarding", require("./routes/onboarding"));
app.use("/api/tasks", require("./routes/task"));
app.use("/api/proposals", require("./routes/proposal"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/contracts", require("./routes/contract"));
app.use("/api/contracts", require("./routes/contract"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/progress", require("./routes/progress"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/chat", require("./routes/chatRouter"));
app.use("/api/ai", require("./routes/aiRanking"));
app.use("/api/feedback", require("./routes/feedback"));

// Global error handler — must be defined after all routes
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  console.error(`[Error] ${req.method} ${req.originalUrl} — ${err.message}`);

  res.status(status).json({
    message: isProduction ? "An unexpected error occurred" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "vendorlink-api"
  });
});

app.get("/", (req, res) => {
  res.redirect("/health");
});

const startServer = async () => {
  try {
    await connectDB();

    // 1. Migration & Cleanup: Generate uids and fix legacy data
    const usersToClean = await User.find({ 
      $or: [
        { uid: { $exists: false } },
        { googleId: null },
        { authProvider: { $nin: ["local", "google"] } }
      ] 
    });

    if (usersToClean.length > 0) {
      console.log(`[Migration] Found ${usersToClean.length} users requiring cleanup. Fixing...`);
      const crypto = require("crypto");
      for (const user of usersToClean) {
        const updates = {};
        const unset = {};
        
        if (!user.uid) {
          updates.uid = `VL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        }

        // REMOVE googleId if it is explicit null or an empty string
        if (user.googleId === null || user.googleId === "") {
          unset.googleId = "";
        }

        const updateOp = {};
        if (Object.keys(updates).length > 0) updateOp.$set = updates;
        if (Object.keys(unset).length > 0) updateOp.$unset = unset;

        if (Object.keys(updateOp).length > 0) {
          console.log(`[Migration] Cleaning user ${user.email}...`);
          await User.updateOne({ _id: user._id }, updateOp, { runValidators: false });
        }
      }
      console.log("[Migration] Database cleanup complete.");
    }

    // 2. Sync indexes to handle unique/sparse changes
    try {
      console.log("[Index] Renewing indexes...");
      // Drop the specific problematic indexes
      await User.collection.dropIndex("googleId_1").catch(() => {});
      await User.collection.dropIndex("uid_1").catch(() => {});
      console.log("[Index] Legacy unique indexes dropped");
    } catch (e) { 
      console.log("[Index] Error dropping specific indexes:", e.message);
    }

    await Promise.all([
      User.syncIndexes(), // Use syncIndexes to reconcile schema and DB
      Company.syncIndexes(),
      Vendor.syncIndexes(),
      Notification.syncIndexes(),
      Task.syncIndexes(),
      Proposal.syncIndexes(),
      Contract.syncIndexes(),
      Payment.syncIndexes(),
      Transaction.syncIndexes(),
      Wallet.syncIndexes(),
    ]);
    console.log("Database indexes synchronized");

    const seeded = await seedDemoAdmin();
    if (seeded.created) {
      console.log("Admin account created successfully.");
    } else if (seeded.updated) {
      console.log("Admin account credentials synchronized with .env.");
    } else {
      console.log("Admin account already exists and is up to date.");
    }

    const tryListen = (portToUse) => {
      server.removeAllListeners("error");
      server.removeAllListeners("listening");

      server
        .once("error", (error) => {
          if (error.code === "EADDRINUSE") {
            console.warn(`Port ${portToUse} is in use, trying ${portToUse + 1}...`);
            tryListen(portToUse + 1);
            return;
          }

          console.error("Server listen error:", error.message);
          process.exit(1);
        })
        .once("listening", () => {
          console.log(`Server running on http://localhost:${server.address().port}`);
        })
        .listen(portToUse);
    };

    tryListen(basePort);
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

