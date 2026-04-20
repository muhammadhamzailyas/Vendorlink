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
const WebSocketService = require("./services/wsService");
const NotificationService = require("./services/notificationService");
const NotificationController = require("./controller/notificationController");

dotenv.config();

const app = express();
const server = http.createServer(app);
const basePort = Number(process.env.PORT || 8002);

// Initialize WebSocket + Notification services
const wsService = new WebSocketService(server);
const notificationService = new NotificationService(wsService);
const notificationController = new NotificationController(notificationService);

// Make services accessible from controllers via req.app.get(...)
app.set("wsService", wsService);
app.set("notificationService", notificationService);

app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000, // Increased for development
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  })
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
app.use("/api/chat", require("./routes/chatRouter"));
app.use("/api/contracts", require("./routes/contract"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/progress", require("./routes/progress"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/ai", require("./routes/aiRanking"));

app.get("/", (req, res) => {
  res.send("Server is running and connected to MongoDB!");
});

const startServer = async () => {
  try {
    await connectDB();

    // CLEANUP: Remove any legacy users with null firebaseUid to prevent index build failures
    const cleanupResult = await User.deleteMany({ firebaseUid: { $eq: null } });
    if (cleanupResult.deletedCount > 0) {
      console.log(`Cleaned up ${cleanupResult.deletedCount} legacy users with null firebaseUid`);
    }

    // Ensure DB indexes are created for all schemas.
    await Promise.all([
      User.createIndexes(),
      Company.createIndexes(),
      Vendor.createIndexes(),
      Notification.createIndexes(),
      Task.createIndexes(),
      Proposal.createIndexes(),
      Contract.createIndexes(),
      Payment.createIndexes(),
      Transaction.createIndexes(),
      Wallet.createIndexes(),
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

