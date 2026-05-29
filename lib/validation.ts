import { z } from "zod";
import {
  DEFAULT_EDITOR_FEE_IDR,
  DEFAULT_REPORTER_RATE_IDR,
  JOB_STATUS,
} from "./constants";

const text = z.string().trim().min(1).max(160);
const uuid = z.uuid();

export const sortDirSchema = z.enum(["asc", "desc"]).default("asc");

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(""),
  sortBy: z.string().trim().optional(),
  sortDir: sortDirSchema,
  availability: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  location: z.string().trim().optional(),
  status: z.coerce.number().int().min(0).max(4).optional(),
  isRemote: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const reporterCreateSchema = z.object({
  name: text,
  location: text,
  availability: z.boolean().default(true),
});

export const reporterUpdateSchema = reporterCreateSchema.partial();

export const editorCreateSchema = z.object({
  name: text,
  availability: z.boolean().default(true),
});

export const editorUpdateSchema = editorCreateSchema.partial();

export const jobCreateSchema = z.object({
  caseName: text,
  durationMinutes: z.coerce.number().int().min(1).max(10000),
  location: text,
  isRemote: z.boolean().default(false),
  reporterRateIdr: z.coerce
    .number()
    .int()
    .min(0)
    .default(DEFAULT_REPORTER_RATE_IDR),
  editorFeeIdr: z.coerce.number().int().min(0).default(DEFAULT_EDITOR_FEE_IDR),
});

export const jobUpdateSchema = jobCreateSchema.partial();

export const assignReporterSchema = z.object({
  reporterId: uuid.optional(),
});

export const assignEditorSchema = z.object({
  editorId: uuid.optional(),
});

export const statusUpdateSchema = z.object({
  status: z.coerce
    .number()
    .int()
    .refine((value) => Object.values(JOB_STATUS).some((status) => status === value), {
      error: "Invalid job status",
    }),
  note: z.string().trim().max(240).optional(),
});

export const paymentUpdateSchema = z.object({
  reporterRateIdr: z.coerce.number().int().min(0).optional(),
  editorFeeIdr: z.coerce.number().int().min(0).optional(),
});

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  return schema.safeParse(body);
}

export function parseListQuery(url: string) {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  return listQuerySchema.safeParse(params);
}
