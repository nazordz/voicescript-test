import { JOB_STATUS } from "@/lib/constants";
import { badRequest, notFound, ok, serverError, validationError } from "@/lib/api";
import { assertNextStatus, jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { parseJson, statusUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, statusUpdateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return notFound("Job not found.");
    }

    if (!assertNextStatus(job.status, body.data.status)) {
      return badRequest("Status must follow the workflow sequence.");
    }

    if (body.data.status === JOB_STATUS.ASSIGNED && !job.reporterId) {
      return badRequest("Assign a reporter before moving to ASSIGNED.");
    }

    if (body.data.status === JOB_STATUS.REVIEWED && !job.editorId) {
      return badRequest("Assign an editor before moving to REVIEWED.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.job.update({
        where: { id },
        data: { status: body.data.status },
        include: jobInclude,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId: id,
          fromStatus: job.status,
          toStatus: body.data.status,
          note: body.data.note ?? "Status updated.",
        },
      });

      return next;
    });

    return ok(serializeJob(updated));
  } catch (error) {
    return serverError(error);
  }
}
