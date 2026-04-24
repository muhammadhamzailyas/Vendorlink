const User = require("../model/user");
const { verifyFirebaseIdToken } = require("../utils/firebaseAdmin");

/**
 * Authentication Middleware using Firebase Admin SDK
 * 
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify token with Firebase Admin SDK
 * 3. Attach decoded Firebase user to req.firebaseUser
 * 4. Fetch/attach MongoDB user to req.user (if required)
 */
class AuthMiddleware {
  /**
   * Internal helper to extract token from header
   */
  extractBearerToken = (req) => {
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.split(" ")[1].trim();
  };

  /**
   * STRICT: Verifies Firebase token AND ensures MongoDB user exists.
   * Use this for all protected application routes.
   */
  authmiddleware = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        console.warn("[Auth] Missing token for route:", req.originalUrl);
        return res.status(401).json({ message: "Authentication required (missing token)" });
      }

      const decoded = await verifyFirebaseIdToken(token);
      req.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email || "",
        phoneNumber: decoded.phone_number || "",
      };

      // Retry logic for MongoDB sync (handles race conditions during first login)
      let user = null;
      let retries = 3;
      while (retries > 0) {
        user = await User.findOne({ firebaseUid: decoded.uid });
        if (user) break;
        
        console.log(`[Auth] User not found for UID ${decoded.uid}, retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
        retries--;
      }

      if (!user) {
        console.error(`[Auth] Error: User with UID ${decoded.uid} not found in MongoDB after retries.`);
        return res.status(401).json({ 
          message: "User profile not synchronized. Please log in again.",
          code: "USER_NOT_SYNCED" 
        });
      }

      if (user.isDeleted) {
        console.warn(`[Auth] Denied: User ${decoded.uid} is deleted.`);
        return res.status(401).json({ message: "Account has been deactivated" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("[Auth] Middleware Exception:", error.message);
      return res.status(401).json({ message: "Invalid or expired session", error: error.message });
    }
  };

  /**
   * LIGHT: Verifies Firebase token but DOES NOT require MongoDB user to exist.
   * Use this for session bootstrap or initial onboarding steps.
   */
  authAllowUnprovisioned = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = await verifyFirebaseIdToken(token);
      req.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email || "",
        phoneNumber: decoded.phone_number || "",
      };

      // Optional: attach user if they happen to exist
      req.user = await User.findOne({ firebaseUid: decoded.uid });
      
      next();
    } catch (error) {
      console.error("[Auth] Light Middleware Exception:", error.message);
      return res.status(401).json({ message: "Invalid or expired session", error: error.message });
    }
  };

  /**
   * INTERNAL: Only verifies the Firebase token.
   * Useful for internal verification routes.
   */
  verifyFirebaseToken = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Token missing" });
      }

      const decoded = await verifyFirebaseIdToken(token);
      req.firebaseUser = {
        uid: decoded.uid,
        email: decoded.email || "",
      };
      next();
    } catch (error) {
      return res.status(401).json({ message: "Verification failed" });
    }
  };

  /**
   * Role-based access control
   */
  requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}` 
        });
      }

      next();
    };
  };

  /**
   * Admin-only access
   */
  adminmiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };
}

module.exports = new AuthMiddleware();
