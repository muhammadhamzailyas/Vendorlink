import React from "react";
import {
  CheckCircle,
  WarningCircle,
  Info,
  Warning,
} from "@phosphor-icons/react";
import { Toaster, toast as sonnerToast } from "sonner";

const CONFIG = {
  position: "bottom-right",
  closeButton: true,
  limit: 1,
};

const DURATIONS = {
  error: 5000,
  warning: 4000,
  info: 3000,
  success: 3000,
};

const activeToasts = new Set();

const TYPE_ICON = {
  success: <CheckCircle className="h-5 w-5" style={{ stroke: 'var(--success)' }} />,
  error: <WarningCircle className="h-5 w-5" style={{ stroke: 'var(--error)' }} />,
  warning: <Warning className="h-5 w-5" style={{ stroke: 'var(--warning)' }} />,
  info: <Info className="h-5 w-5" style={{ stroke: 'var(--info)' }} />,
};

const TYPE_METHOD = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
};

const FRIENDLY_ERRORS = {
  // Firebase Auth
  "auth/invalid-email": "The email address you entered is not valid",
  "auth/user-not-found": "We couldn't find an account with that email",
  "auth/wrong-password": "The password you entered is incorrect",
  "auth/email-already-in-use": "This email is already registered. Try logging in instead",
  "auth/weak-password": "Your password should be at least 6 characters long",
  "auth/too-many-requests": "Too many failed attempts. Please try again in a few minutes",
  "auth/network-request-failed": "Network error. Please check your internet connection",
  "auth/popup-closed-by-user": "Login window was closed before completion",
  "auth/operation-not-allowed": "This login method is currently disabled",
  "auth/invalid-credential": "The credentials provided are invalid or expired",
  "auth/user-disabled": "This account has been disabled",
  "auth/requires-recent-login": "Please log in again before making this change",
  "auth/account-exists-with-different-credential": "An account already exists with this email using a different login method",
  
  // General & Technical
  "Network Error": "Could not connect to the server. Please check your internet",
  "Request failed with status code 500": "The server encountered an error. Please try again later",
  "Firebase is not configured": "Service temporarily unavailable. Please try again later",
  "config-not-found": "System configuration missing. Please contact support",
};

const formatErrorMessage = (message) => {
  if (!message) return "An unexpected error occurred";
  
  const msgStr = String(message);

  // 1. Check for explicit code matches (e.g. auth/invalid-email)
  const firebaseMatch = msgStr.match(/\((auth\/[^)]+)\)/);
  const codeToMatch = firebaseMatch ? firebaseMatch[1] : msgStr;

  // 2. Direct match or key-in-string match
  const exactMatchKey = Object.keys(FRIENDLY_ERRORS).find(key => 
    codeToMatch.toLowerCase().includes(key.toLowerCase()) || 
    msgStr.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatchKey) return FRIENDLY_ERRORS[exactMatchKey];

  // 3. Fallback: Strip common technical prefixes
  return msgStr
    .replace(/^Firebase: Error\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .replace(/\(auth\/[^)]+\)\.?/g, "") // remove (auth/...)
    .replace(/\.$/, "")
    .trim() || "An unexpected error occurred";
};

const sanitizeErrorMessage = (error) => {
  if (typeof error === "string") return formatErrorMessage(error);
  if (error?.message) return formatErrorMessage(error.message);
  return null;
};

export const showToast = (type, message, options = {}) => {
  const id = options.toastId || Math.random().toString(36).substring(2, 9);

  const common = {
    id,
    duration: options.autoX,
    icon: options.icon !== undefined ? options.icon : TYPE_ICON[type],
    onDismiss: () => {
      activeToasts.delete(id);
      if (typeof options.onX === "function") options.onX();
    },
  };

  activeToasts.add(id);

  const method = TYPE_METHOD[type] || sonnerToast;
  method(message, common);

  return id;
};

export const dismissToast = (toastId) => {
  if (toastId) {
    activeToasts.delete(toastId);
    sonnerToast.dismiss(toastId);
    return;
  }

  activeToasts.clear();
  sonnerToast.dismiss();
};

export const confirmToast = (
  message,
  {
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    description,
    toastId,
  } = {}
) => {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const id = toastId || Math.random().toString(36).substring(2, 9);

    sonnerToast(message, {
      id,
      description,
      duration: Infinity,
      action: {
        label: confirmLabel,
        onClick: () => finish(true),
      },
      cancel: {
        label: cancelLabel,
        onClick: () => finish(false),
      },
      onDismiss: () => finish(false),
      onAutoX: () => finish(false),
    });
  });
};

export const ToastViewport = () => (
  <Toaster
    position={CONFIG.position}
    closeButton={CONFIG.closeButton}
    visibleToasts={CONFIG.limit}
    richColors
    theme="light"
    toastOptions={{
      className: "rounded-xl border border-[var(--border)] bg-[var(--card)] !text-[var(--foreground)] font-bold shadow-lg !p-4",
      descriptionClassName: "!text-[var(--muted-foreground)] text-xs font-medium mt-1",
    }}
  />
);

export const handleApiError = (
  error,
  options = { defaultMessage: "Something went wrong. Please try again." }
) => {
  const status = error?.response?.status;
  const fieldErrors = error?.response?.data?.errors;
  const firstFieldMessage =
    fieldErrors && typeof fieldErrors === "object"
      ? Object.values(fieldErrors).find((msgs) => Array.isArray(msgs) && msgs.length)?.[0]
      : null;
  const rawMessage =
    firstFieldMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    sanitizeErrorMessage(error) ||
    options.defaultMessage;

  const message = formatErrorMessage(rawMessage);

  if (status === 401) return showToast("error", message, { autoX: 5000 });
  if (status === 403) return showToast("error", "Access Denied: " + message, { autoX: 5000 });
  if (status === 404) return showToast("error", "Not Found: " + message, { autoX: 4000 });
  if (status >= 500) return showToast("error", "Server Error: " + message, { autoX: 6000 });
  return showToast("error", message, options);
};

export const toast = {
  success: (msg, opts) => showToast("success", msg, { autoX: DURATIONS.success, ...opts }),
  error: (msg, opts) => showToast("error", formatErrorMessage(msg), { autoX: DURATIONS.error, ...opts }),
  info: (msg, opts) => showToast("info", msg, { autoX: DURATIONS.info, ...opts }),
  warning: (msg, opts) => showToast("warning", msg, { autoX: DURATIONS.warning, ...opts }),
  validationError: (msg, opts) => showToast("warning", msg, { autoX: DURATIONS.warning, ...opts }),
  handleApiError,
  dismiss: dismissToast,
  confirm: confirmToast,
};

export default toast;
