export function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "bg-brand-mint text-brand-forest";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "LAPSED":
      return "bg-orange-100 text-orange-800";
    case "CANCELLED":
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function statusLabel(status?: string | null) {
  if (!status) return "—";
  return status.charAt(0) + status.slice(1).toLowerCase();
}