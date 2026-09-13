import axios from "axios";
import { z } from "zod";

/* ============================================================
   ADMIN PEOPLE DATA LAYER — lib/adminPeople.ts
   ------------------------------------------------------------
   Shared Zod schemas + typed fetch helpers used by the SSR
   people pages (landlords / tenants / staff lists + details).

   COURSE CONCEPTS:
   - AXIOS (Axios.pptx): axios imported directly, backend URL
     from NEXT_PUBLIC_API_URL in .env.local (course convention).
   - ZOD: every backend response is validated with safeParse
     before the page renders it.
   - Used from SERVER COMPONENTS (SSR) — the JWT comes from the
     admin's cookie via lib/adminAuth.ts.
   ============================================================ */

// ---- shared pieces ----
export const adminRefSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// ---- LANDLORD / STAFF share the same list shape ----
export const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.string(),
  created_at: z.string(),
  created_by: adminRefSchema.nullable(),
});
export type AdminPerson = z.infer<typeof personSchema>;

// ---- TENANT has extra fields ----
export const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  nid_number: z.string(),
  has_vehicle: z.boolean(),
  status: z.string(),
  created_at: z.string(),
  property: z
    .object({ id: z.number(), unit_number: z.string() })
    .nullable(),
  approved_by: adminRefSchema.nullable(),
});
export type AdminTenant = z.infer<typeof tenantSchema>;

// Array schemas for the list endpoints
export const peopleListSchema = z.array(personSchema);
export const tenantListSchema = z.array(tenantSchema);

/* GET a validated LIST from the backend (server-side).
   Returns [] when the backend is unreachable so the page can
   still render (fail-soft, same pattern as the dashboard). */
export async function getAdminList<T>(
  url: string,
  token: string,
  schema: z.ZodType<T[]>,
): Promise<T[]> {
  try {
    const response = await axios.get(
      process.env.NEXT_PUBLIC_API_URL + url,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const parsed = schema.safeParse(response.data);
    if (!parsed.success) {
      console.error(`Zod validation failed for ${url}`);
      return [];
    }
    return parsed.data;
  } catch (error) {
    console.error(`Axios request failed for ${url}`);
    return [];
  }
}

/* GET one validated DETAIL object (server-side).
   Returns null on any failure (including 404) so the dynamic
   page can call notFound(). */
export async function getAdminDetail<T>(
  url: string,
  token: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  try {
    const response = await axios.get(
      process.env.NEXT_PUBLIC_API_URL + url,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const parsed = schema.safeParse(response.data);
    if (!parsed.success) {
      console.error(`Zod validation failed for ${url}`);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error(`Axios request failed for ${url}`);
    return null;
  }
}
