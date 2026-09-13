import axios from "axios";
import { z } from "zod";
import { getAdminSession, authHeader } from "./adminAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const createdBySchema = z
  .object({ id: z.number(), name: z.string(), email: z.string().optional() })
  .nullish();

const propertyRefSchema = z
  .object({ id: z.number(), unit_number: z.string().optional() })
  .nullish();

export const landlordSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.string().nullish(),
  created_at: z.string(),
  created_by: createdBySchema,
  property: propertyRefSchema,
});

export const tenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  nid_number: z.string(),
  has_vehicle: z.boolean(),
  status: z.string().nullish(),
  created_at: z.string(),
  approved_by: createdBySchema,
  property: propertyRefSchema,
});

export const staffSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.string().nullish(),
  created_at: z.string(),
  created_by: createdBySchema,
});

export type Landlord = z.infer<typeof landlordSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type Staff = z.infer<typeof staffSchema>;

export async function fetchPeopleList<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const session = await getAdminSession();
  if (!session) return [];

  try {
    const response = await axios.get(`${API}/admin/${path}`, {
      headers: authHeader(session.token),
      timeout: 8000,
    });
    const parsed = z.array(schema).safeParse(response.data);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function fetchPeopleDetail<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED");

  try {
    const response = await axios.get(`${API}/admin/${path}`, {
      headers: authHeader(session.token),
      timeout: 8000,
    });
    const parsed = schema.safeParse(response.data);
    if (!parsed.success) throw new Error("NOT_FOUND");
    return parsed.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("NOT_FOUND");
    }
    throw new Error("BACKEND_DOWN");
  }
}
