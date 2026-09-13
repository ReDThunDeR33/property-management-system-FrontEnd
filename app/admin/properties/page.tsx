"use client";


import { useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import { authHeader } from "@/lib/getToken";

type Property = {
  id: number;
  unit_number: string;
  building: { id: number; name: string } | null;
  landlord: { id: number; name: string };
  tenant: { id: number; name: string } | null;
  rent_amount: number | string;
  service_charge: number | string | null;
  has_parking: boolean;
  parking_fee: number | string | null;
  listing_status: string;
  status: string;
  created_at: string;
};

type IdName = { id: number; name: string };

/* Zod schema mirroring the backend DTOs. Optional decimal
   fields arrive empty from inputs -> preprocess "" to
   undefined so they are simply omitted from the payload. */
const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive("Must be a positive number").optional(),
);

const propertySchema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  buildingId: z.coerce.number().min(1, "Please choose a building"),
  landlordId: z.coerce.number().min(1, "Please choose a landlord"),
  rent_amount: z.coerce
    .number({ message: "Rent must be a number" })
    .positive("Rent must be greater than 0"),
  service_charge: optionalPositiveNumber,
  has_parking: z.boolean(),
  parking_fee: optionalPositiveNumber,
  listing_status: z.enum(["not_listed", "for_rent", "for_sale"]),
  status: z.enum(["vacant", "occupied", "sold"]),
});

type PropertyFormState = {
  unit_number: string;
  buildingId: number | string;
  landlordId: number | string;
  rent_amount: string;
  service_charge: string;
  has_parking: boolean;
  parking_fee: string;
  listing_status: string;
  status: string;
};
type FieldErrors = Partial<Record<keyof PropertyFormState, string>>;

const EMPTY_FORM: PropertyFormState = {
  unit_number: "",
  buildingId: 0,
  landlordId: 0,
  rent_amount: "",
  service_charge: "",
  has_parking: false,
  parking_fee: "",
  listing_status: "not_listed",
  status: "vacant",
};

export default function AdminPropertiesPage() {
  // ----- list + parent-option state -----
  const [properties, setProperties] = useState<Property[]>([]);
  const [buildings, setBuildings] = useState<IdName[]>([]);
  const [landlords, setLandlords] = useState<IdName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----- modal + form state -----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PropertyFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [banner, setBanner] = useState("");

  /* useEffect: load properties + buildings + landlords once.
     The latter two feed the parent selects in the form. */
  useEffect(() => {
    fetchProperties();
    fetchBuildings();
    fetchLandlords();
  }, []);

  async function fetchProperties() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/property/allproperties",
        { headers: authHeader() },
      );
      setProperties(response.data);
    } catch {
      setError("Could not load properties. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBuildings() {
    try {
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/building/allbuildings",
        { headers: authHeader() },
      );
      setBuildings(response.data);
    } catch {
      console.error("Could not load buildings for the select");
    }
  }

  async function fetchLandlords() {
    try {
      const response = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/admin/landlord/alllandlord",
        { headers: authHeader() },
      );
      setLandlords(response.data);
    } catch {
      console.error("Could not load landlords for the select");
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      buildingId: buildings[0]?.id ?? 0,
      landlordId: landlords[0]?.id ?? 0,
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEditModal(property: Property) {
    setEditingId(property.id);
    setForm({
      unit_number: property.unit_number,
      buildingId: property.building?.id ?? 0,
      landlordId: property.landlord.id,
      rent_amount: String(property.rent_amount),
      service_charge:
        property.service_charge === null || property.service_charge === undefined
          ? ""
          : String(property.service_charge),
      has_parking: property.has_parking,
      parking_fee:
        property.parking_fee === null || property.parking_fee === undefined
          ? ""
          : String(property.parking_fee),
      listing_status: property.listing_status,
      status: property.status,
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  // Controlled inputs (useState) for text/select inputs.
  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Separate handler for the checkbox (boolean instead of string).
  function handleParkingChange(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((previous) => ({ ...previous, has_parking: event.target.checked }));
  }

  /* Zod validates first; only valid data reaches the backend. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");

    const result = propertySchema.safeParse(form);
    if (!result.success) {
      const newErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof PropertyFormState;
        if (field && !newErrors[field]) newErrors[field] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      if (editingId === null) {
        await axios.post(
          process.env.NEXT_PUBLIC_API_URL + "/admin/property/create",
          result.data,
          { headers: authHeader() },
        );
        setBanner("Property created successfully.");
      } else {
        await axios.patch(
          process.env.NEXT_PUBLIC_API_URL + `/admin/property/update/${editingId}`,
          result.data,
          { headers: authHeader() },
        );
        setBanner("Property updated successfully.");
      }

      closeModal();
      await fetchProperties();
      setTimeout(() => setBanner(""), 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setBanner(
          typeof message === "string" ? message : "Could not save the property.",
        );
      } else {
        setBanner("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await axios.delete(
        process.env.NEXT_PUBLIC_API_URL + `/admin/property/delete/${deleteTarget.id}`,
        { headers: authHeader() },
      );
      setBanner("Property deleted.");
      setDeleteTarget(null);
      await fetchProperties();
      setTimeout(() => setBanner(""), 4000);
    } catch {
      setBanner("Could not delete the property.");
    } finally {
      setSubmitting(false);
    }
  }

  // Small display helpers for money fields (they arrive as strings).
  function money(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") return "-";
    return `৳${Number(value).toLocaleString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all properties, pricing and availability. {properties.length} total.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={openCreateModal}
          disabled={buildings.length === 0 || landlords.length === 0}
        >
          + New Property
        </button>
      </div>

      {(buildings.length === 0 || landlords.length === 0) && !loading && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-warning">
            You need at least one building and one landlord before creating a property.
          </span>
        </div>
      )}

      {banner && (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-success">{banner}</span>
        </div>
      )}

      {loading ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-base-300" />
            <div className="h-4 w-full animate-pulse rounded bg-base-300" />
          </div>
        </div>
      ) : error ? (
        <div className="alert border-base-300 bg-white shadow-sm">
          <span className="text-sm text-error">{error}</span>
          <button className="btn btn-xs" onClick={fetchProperties}>
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="card-body items-center text-center">
            <p className="text-sm text-gray-500">No properties created yet.</p>
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th>Unit</th>
                  <th>Building</th>
                  <th>Landlord</th>
                  <th>Tenant</th>
                  <th>Rent</th>
                  <th>Status</th>
                  <th>Listing</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="font-semibold">{property.unit_number}</td>
                    <td className="text-sm text-gray-600">
                      {property.building?.name ?? "-"}
                    </td>
                    <td className="text-sm text-gray-600">{property.landlord?.name}</td>
                    <td className="text-sm text-gray-600">
                      {property.tenant?.name ?? "—"}
                    </td>
                    <td className="text-sm">{money(property.rent_amount)}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          property.status === "occupied"
                            ? "badge-success"
                            : property.status === "sold"
                              ? "badge-info"
                              : "badge-warning"
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{property.listing_status}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEditModal(property)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(property)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit modal (Zod-validated form) */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="text-lg font-bold">
              {editingId === null ? "New Property" : "Edit Property"}
            </h3>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              {/* Unit + building + landlord */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Unit number
                  </label>
                  <input
                    type="text"
                    name="unit_number"
                    value={form.unit_number}
                    onChange={handleInputChange}
                    placeholder="e.g. A-101"
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.unit_number && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.unit_number}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Building
                  </label>
                  <select
                    name="buildingId"
                    value={form.buildingId}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    <option value={0}>Select...</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.buildingId && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.buildingId}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Landlord
                  </label>
                  <select
                    name="landlordId"
                    value={form.landlordId}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    <option value={0}>Select...</option>
                    {landlords.map((landlord) => (
                      <option key={landlord.id} value={landlord.id}>
                        {landlord.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.landlordId && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.landlordId}</p>
                  )}
                </div>
              </div>

              {/* Money fields + parking */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Rent amount
                  </label>
                  <input
                    type="number"
                    name="rent_amount"
                    value={form.rent_amount}
                    onChange={handleInputChange}
                    placeholder="e.g. 15000"
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.rent_amount && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.rent_amount}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Service charge (optional)
                  </label>
                  <input
                    type="number"
                    name="service_charge"
                    value={form.service_charge ?? ""}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.service_charge && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.service_charge}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Parking fee (optional)
                  </label>
                  <input
                    type="number"
                    name="parking_fee"
                    value={form.parking_fee ?? ""}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={submitting}
                  />
                  {fieldErrors.parking_fee && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.parking_fee}</p>
                  )}
                </div>

                <div className="flex items-end pb-2">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={form.has_parking}
                      onChange={handleParkingChange}
                      disabled={submitting}
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      Has parking
                    </span>
                  </label>
                </div>
              </div>

              {/* Enums */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Listing status
                  </label>
                  <select
                    name="listing_status"
                    value={form.listing_status}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    <option value="not_listed">not_listed</option>
                    <option value="for_rent">for_rent</option>
                    <option value="for_sale">for_sale</option>
                  </select>
                  {fieldErrors.listing_status && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.listing_status}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Occupancy status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    disabled={submitting}
                  >
                    <option value="vacant">vacant</option>
                    <option value="occupied">occupied</option>
                    <option value="sold">sold</option>
                  </select>
                  {fieldErrors.status && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.status}</p>
                  )}
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? "Saving..." : editingId === null ? "Create" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="text-lg font-bold">Delete property?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Unit &quot;{deleteTarget.unit_number}&quot; will be removed permanently.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={submitting}>
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
