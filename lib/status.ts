// Turns a status string into a tailwind color name, used for the
// colored pill badges (bg-{color}-100 text-{color}-600).
// Plain if-statements on purpose, nothing clever to trace here.

export function statusColor(status: string) {
  if (status === "pending") return "yellow";
  if (status === "assigned") return "blue";
  if (status === "tenant_confirmed") return "purple";
  if (status === "complete") return "green";
  if (status === "OPEN") return "red";
  if (status === "IN_PROGRESS") return "blue";
  if (status === "RESOLVED") return "green";
  if (status === "free") return "green";
  if (status === "busy") return "yellow";
  return "gray";
}
