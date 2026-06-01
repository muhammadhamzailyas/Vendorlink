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
  success: <CheckCircle className="h-5 w-5" weight="fill" style={{ color: '#22c55e' }} />,
  error: <WarningCircle className="h-5 w-5" weight="fill" style={{ color: '#ef4444' }} />,
  warning: <Warning className="h-5 w-5" weight="fill" style={{ color: '#f59e0b' }} />,
  info: <Info className="h-5 w-5" weight="fill" style={{ color: '#3b82f6' }} />,
};

const TYPE_METHOD = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
};

const FRIENDLY_ERRORS = {
  // Auth Errors
  "invalid-email": "The email address you entered is not valid",
  "user-not-found": "We couldn't find an account with that email",
  "wrong-password": "The password you entered is incorrect",
  "email-already-in-use": "This email is already registered. Try logging in instead",
  "weak-password": "Your password should be at least 6 characters long",
  "too-many-requests": "Too many failed attempts. Please try again in a few minutes",
  "unauthorized": "Invalid credentials or session expired",
  
  // General & Technical
  "Network Error": "Could not connect to the server. Please check your internet",
  "Request failed with status code 500": "The server encountered an error. Please try again later",
  "config-not-found": "System configuration missing. Please contact support",
};

const formatErrorMessage = (message) => {
  if (!message) return "An unexpected error occurred";
  
  const msgStr = String(message);

  // 1. Direct match or key-in-string match
  const exactMatchKey = Object.keys(FRIENDLY_ERRORS).find(key => 
    msgStr.toLowerCase().includes(key.toLowerCase())
  );
  
  if (exactMatchKey) return FRIENDLY_ERRORS[exactMatchKey];

  // 2. Fallback: Strip common technical prefixes
  return msgStr
    .replace(/^Error:\s*/i, "")
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
  <>
    <style dangerouslySetInnerHTML={{ __html: `
      [data-sonner-toast] {
        --toast-close-button-start: auto !important;
        --toast-close-button-end: 12px !important;
        --toast-close-button-top: 50% !important;
        --toast-close-button-transform: translateY(-50%) !important;
      }
      [data-sonner-toast] [data-close-button] {
        left: var(--toast-close-button-start) !important;
        right: var(--toast-close-button-end) !important;
        top: var(--toast-close-button-top) !important;
        transform: var(--toast-close-button-transform) !important;
        background: var(--muted) !important;
        border: 1px solid var(--border) !important;
        color: var(--foreground) !important;
        opacity: 1 !important;
      }
      [data-sonner-toast] [data-icon] {
        margin-right: 12px !important;
        flex-shrink: 0 !important;
      }
      [data-sonner-toast] [data-content] {
        color: var(--foreground) !important;
        font-weight: 600 !important;
      }
    `}} />
    <Toaster
      position={CONFIG.position}
      closeButton={CONFIG.closeButton}
      visibleToasts={CONFIG.limit}
      theme="dark"
      toastOptions={{
        className: "rounded-xl border border-border bg-card shadow-2xl !p-4 !pl-5",
        descriptionClassName: "text-muted-foreground text-[11px] font-medium mt-0.5",
      }}
    />
  </>
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

const toast = {
  success: (msg, opts) => showToast("success", msg, { autoX: DURATIONS.success, ...opts }),
  error: (msg, opts) => showToast("error", formatErrorMessage(msg), { autoX: DURATIONS.error, ...opts }),
  info: (msg, opts) => showToast("info", msg, { autoX: DURATIONS.info, ...opts }),
  warning: (msg, opts) => showToast("warning", msg, { autoX: DURATIONS.warning, ...opts }),
  loading: (msg, opts) => sonnerToast.loading(msg, opts),
  validationError: (msg, opts) => showToast("warning", msg, { autoX: DURATIONS.warning, ...opts }),
  handleApiError,
  dismiss: dismissToast,
  confirm: confirmToast,
};

export { toast };
export default toast;

