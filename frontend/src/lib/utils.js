/**
 * Formatting and validation utility functions
 */

/**
 * Formats a number as USD currency
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (value === undefined || value === null || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

/**
 * Validates password complexity
 * @param {string} password 
 * @returns {boolean|string} True if valid, or error message string
 */
export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Min 8 characters required";
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return "Must include uppercase, lowercase, number & special char";
  }
  
  return true;
};
