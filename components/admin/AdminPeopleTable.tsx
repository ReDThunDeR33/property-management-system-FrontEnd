/* ============================================================
   ADMIN PEOPLE TABLE — components/admin/AdminPeopleTable.tsx
   ------------------------------------------------------------
   Reusable table for people lists (landlords / tenants / staff).

   COURSE CONCEPTS:
   - PROPS: every column value, the meta label, status badges,
     detail links and (optionally) Edit/Delete action handlers
     arrive via props — the component holds no data of its own
     (Task2 props style).
   - DAISYUI: `table` + `badge` components.

   Used by the client manager components: when onEdit/onDelete
   are provided, Edit/Delete buttons appear next to View.
   ============================================================ */

import Link from "next/link";

// One normalized row — each manager maps its API data into
// this simple shape and passes it down as props.
export type AdminPeopleRow = {
  id: number;
  name: string;
  email: string;
  meta?: string;
  status: string;
  footer?: string;
  detailHref: string;
};

type AdminPeopleTableProps = {
  metaLabel: string;
  rows: AdminPeopleRow[];
  emptyMessage: string;
  // Optional CRUD actions (client manager components pass these).
  onEdit?: (row: AdminPeopleRow) => void;
  onDelete?: (row: AdminPeopleRow) => void;
};

// Status -> DaisyUI badge color.
function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED" || normalized === "ACTIVE") return "badge-success";
  if (normalized === "PENDING") return "badge-warning";
  if (normalized === "REJECTED" || normalized === "INACTIVE") return "badge-error";
  return "badge-ghost";
}

export default function AdminPeopleTable({
  metaLabel,
  rows,
  emptyMessage,
  onEdit,
  onDelete,
}: AdminPeopleTableProps) {
  if (rows.length === 0) {
    return (
      <div className="card border border-base-300 bg-white shadow-sm">
        <div className="card-body items-center text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-300 bg-white shadow-sm">
      <div className="overflow-x-auto">
        {/* DaisyUI table */}
        <table className="table">
          <thead>
            <tr className="text-xs uppercase text-gray-500">
              <th>Name</th>
              <th>Email</th>
              <th>{metaLabel}</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <p className="font-semibold">{row.name}</p>
                  {row.footer && (
                    <p className="text-[11px] text-gray-400">{row.footer}</p>
                  )}
                </td>
                <td className="text-sm text-gray-600">{row.email}</td>
                <td className="text-sm text-gray-600">{row.meta ?? "-"}</td>
                <td>
                  <span className={`badge badge-sm ${statusBadgeClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    {/* Link to the dynamic detail route /admin/<role>/[id] */}
                    <Link
                      href={row.detailHref}
                      className="btn btn-ghost btn-xs text-dwellix-500"
                    >
                      View
                    </Link>

                    {/* Optional Edit/Delete actions (props-driven) */}
                    {onEdit && (
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onEdit(row)}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
