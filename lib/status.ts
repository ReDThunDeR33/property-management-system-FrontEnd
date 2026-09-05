// Maps backend status/enum values to a tailwind color name, same
// pattern used for the "issue.color" values on the dashboard page.

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "yellow",
    assigned: "blue",
    tenant_confirmed: "purple",
    complete: "green",
    OPEN: "red",
    IN_PROGRESS: "blue",
    RESOLVED: "green",
    free: "green",
    busy: "yellow",
    active: "green",
    deactive: "gray",
    for_rent: "blue",
    not_listed: "gray",
    vacant: "gray",
    occupied: "green",
    approved: "green",
    APPROVED: "green",
  };
  return map[status] || "gray";
}
