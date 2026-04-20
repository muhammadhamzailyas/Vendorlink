const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

const FALLBACK_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

const isSrvDnsError = (error) =>
  Boolean(error?.message && (error.message.includes("querySrv ECONNREFUSED") || error.message.includes("querySrv ETIMEOUT")));

const connectWithUri = async (uri) =>
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Database connection error: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    const conn = await connectWithUri(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (isSrvDnsError(error)) {
      const originalServers = dns.getServers();

      try {
        dns.setServers(FALLBACK_DNS_SERVERS);
        const conn = await connectWithUri(uri);
        console.log(
          `MongoDB Connected (with DNS fallback): ${conn.connection.host}`
        );
        return;
      } catch (retryError) {
        try {
          dns.setServers(originalServers);
        } catch (_) {
          // Ignore DNS reset failures and continue with original error reporting.
        }

        console.error(
          "Database connection error after DNS fallback:",
          retryError.message
        );
        process.exit(1);
      }
    }

    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
