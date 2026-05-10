const User = require("../model/user");
const { verifyToken } = require("../utils/jwt");

/**
 * Authentication Middleware using JWT
 * 
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify token with JWT secret
 * 3. Attach decoded payload to req.tokenPayload
 * 4. Fetch/attach MongoDB user to req.user
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
   * STRICT: Verifies JWT token AND ensures MongoDB user exists.
   * Use this for all protected application routes.
   */
  authmiddleware = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = verifyToken(token);
      req.tokenPayload = decoded;

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ 
          message: "User profile not found. Please log in again.",
          code: "USER_NOT_FOUND" 
        });
      }

      if (user.isDeleted) {
        return res.status(401).json({ message: "Account has been deactivated" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("[Auth] Middleware Exception:", error.message);
      return res.status(401).json({ message: "Invalid or expired session" });
    }
  };

  /**
   * LIGHT: Verifies JWT token but DOES NOT require MongoDB user to exist.
   * Use this for session bootstrap or initial onboarding steps.
   */
  authAllowUnprovisioned = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = verifyToken(token);
      req.tokenPayload = decoded;

      // Optional: attach user if they happen to exist
      req.user = await User.findById(decoded.id);
      
      next();
    } catch (error) {
      console.error("[Auth] Light Middleware Exception:", error.message);
      return res.status(401).json({ message: "Invalid or expired session" });
    }
  };

  /**
   * INTERNAL: Only verifies the JWT token.
   * Useful for internal verification routes.
   */
  verifyJwtToken = async (req, res, next) => {
    try {
      const token = this.extractBearerToken(req);
      if (!token) {
        return res.status(401).json({ message: "Token missing" });
      }

      const decoded = verifyToken(token);
      req.tokenPayload = decoded;
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
