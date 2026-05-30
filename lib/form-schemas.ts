import { z } from "zod";
import { DEFAULT_EDITOR_FEE_IDR, DEFAULT_REPORTER_RATE_IDR } from "./constants";

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(160, "Name must be 160 characters or fewer");

const location = z
  .string()
  .trim()
  .min(1, "Location is required")
  .max(160, "Location must be 160 characters or fewer");

export const editorFormSchema = z.object({
  name,
  availability: z.boolean(),
});

export type EditorFormValues = z.infer<typeof editorFormSchema>;

export const editorFormDefaults: EditorFormValues = {
  name: "",
  availability: true,
};

export const reporterFormSchema = z.object({
  name,
  location,
  availability: z.boolean(),
});

export type ReporterFormValues = z.infer<typeof reporterFormSchema>;

export const reporterFormDefaults: ReporterFormValues = {
  name: "",
  location: "Jakarta",
  availability: true,
};

export const jobFormSchema = z.object({
  caseName: z
    .string()
    .trim()
    .min(1, "Case name is required")
    .max(160, "Case name must be 160 characters or fewer"),
  durationMinutes: z
    .number({ error: "Minutes is required" })
    .int("Minutes must be a whole number")
    .min(1, "Minutes must be at least 1")
    .max(10000, "Minutes must be 10000 or fewer"),
  location,
  isRemote: z.boolean(),
  reporterRateIdr: z
    .number({ error: "Reporter rate is required" })
    .int("Reporter rate must be a whole number")
    .min(0, "Reporter rate cannot be negative"),
  editorFeeIdr: z
    .number({ error: "Editor fee is required" })
    .int("Editor fee must be a whole number")
    .min(0, "Editor fee cannot be negative"),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

export const jobFormDefaults: JobFormValues = {
  caseName: "",
  durationMinutes: 60,
  location: "Jakarta",
  isRemote: false,
  reporterRateIdr: DEFAULT_REPORTER_RATE_IDR,
  editorFeeIdr: DEFAULT_EDITOR_FEE_IDR,
};
