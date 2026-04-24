export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return { color: "text-emerald-700", bgcolor: "bg-emerald-100" };
    case "pending":
      return { color: "text-warning-muted-fg", bgcolor: "bg-warning-muted" };
    case "rejected":
      return { color: "text-danger-dark", bgcolor: "bg-danger-surface" };
    case "suspended":
      return { color: "text-danger", bgcolor: "bg-danger-surface" };
    default:
      return { color: "text-muted-foreground", bgcolor: "bg-muted" };
  }
};


