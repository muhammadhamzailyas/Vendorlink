const STATUS_STYLES = {
  open: "bg-sky-subtle text-sky-600 border border-sky-400/20",
  "in-progress": "bg-warning/15 text-warning border border-warning/20",
  completed: "bg-jade-subtle text-jade-600 border border-jade-400/20",
  cancelled: "bg-ink-50 text-ink-500 border border-ink-150",
  submitted: "bg-sky-subtle text-sky-600 border border-sky-400/20",
  accepted: "bg-jade-subtle text-jade-600 border border-jade-400/20",
  rejected: "bg-blush-subtle text-blush-600 border border-blush-400/20",
  active: "bg-jade-subtle text-jade-600 border border-jade-400/20",
  pending: "bg-warning/15 text-warning border border-warning/20",
  incomplete: "bg-warning/15 text-warning border border-warning/20",
  approved: "bg-jade-subtle text-jade-600 border border-jade-400/20",
  suspended: "bg-blush-subtle text-blush-600 border border-blush-400/20",
  expired: "bg-ink-50 text-ink-500 border border-ink-150",
  processing: "bg-sky-subtle text-sky-600 border border-sky-400/20",
  failed: "bg-blush-subtle text-blush-600 border border-blush-400/20",
  refunded: "bg-ink-50 text-ink-700 border border-ink-150",
  draft: "bg-ink-50 text-ink-700 border border-ink-150",
  withdrawal: "bg-warning/15 text-warning border border-warning/20",
  deposit: "bg-jade-subtle text-jade-600 border border-jade-400/20",
  payment: "bg-sky-subtle text-sky-600 border border-sky-400/20",
  fee: "bg-ink-50 text-ink-500 border border-ink-150",
};

export const STATUS_VARIANT_MAP = {
  approved: "success",
  completed: "success",
  pending: "warning",
  active: "info",
  rejected: "error",
  cancelled: "error",
  failed: "error",
};

export const normalizeStatus = (status) => String(status || "unknown").trim().toLowerCase();

export const formatStatusLabel = (status) => normalizeStatus(status).replace(/-/g, " ");

export const getStatusClass = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_STYLES[normalized] || "bg-ink-50 text-ink-700 border border-ink-150";
};


