"use client";

import type { ReactNode } from "react";
import { btnGhost, thClass, tdClass } from "@/lib/adminUi";

type AdminPeopleTableProps<T> = {
  columns: string[];
  rows: T[];
  getRowKey: (row: T) => number;
  renderRow: (row: T) => ReactNode;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
};

export default function AdminPeopleTable<T>({
  columns,
  rows,
  getRowKey,
  renderRow,
  onEdit,
  onDelete,
  emptyMessage = "No records found.",
}: AdminPeopleTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className={thClass}>
                {column}
              </th>
            ))}
            {/* Actions column only exists when handlers are provided */}
            {(onEdit || onDelete) && <th className={thClass}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="transition hover:bg-gray-50">
                {renderRow(row)}
                {(onEdit || onDelete) && (
                  <td className={tdClass}>
                    <div className="flex gap-1">
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(row)} className={btnGhost}>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className={`${btnGhost} text-red-600 hover:bg-red-50 hover:text-red-700`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
