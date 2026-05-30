import { JOB_STATUS } from "@/lib/constants";
import { badRequest, notFound, ok, serverError, validationError } from "@/lib/api";
import { jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { assignEditorSchema, parseJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, assignEditorSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return notFound("Job not found.");
    }

    if (job.status < JOB_STATUS.TRANSCRIBED) {
      return badRequest("Editors can only be assigned after transcription.");
    }

    const editor = await prisma.editor.findFirst({
      where: {
        availability: true,
        ...(body.data.editorId ? { id: body.data.editorId } : {}),
      },
      orderBy: body.data.editorId ? undefined : { createdAt: "asc" },
    });

    if (!editor) {
      return badRequest("No available editor found.");
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { editorId: editor.id },
      include: jobInclude,
    });

    return ok(serializeJob(updated));
  } catch (error) {
    return serverError(error);
  }
}
