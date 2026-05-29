import { notFound, noContent, ok, serverError, validationError, conflict } from "@/lib/api";
import { jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { jobUpdateSchema, parseJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: jobInclude,
    });

    return job ? ok(serializeJob(job)) : notFound("Job not found.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, jobUpdateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data: body.data,
      include: jobInclude,
    });

    return ok(serializeJob(job));
  } catch {
    return notFound("Job not found.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const historyCount = await prisma.jobStatusHistory.count({ where: { jobId: id } });

    if (historyCount > 0) {
      return conflict("Job has workflow history and cannot be deleted.");
    }

    await prisma.job.delete({ where: { id } });
    return noContent();
  } catch {
    return notFound("Job not found.");
  }
}
