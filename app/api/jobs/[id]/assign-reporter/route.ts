import { JOB_STATUS } from "@/lib/constants";
import { badRequest, notFound, ok, serverError, validationError } from "@/lib/api";
import { jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { assignReporterSchema, parseJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, assignReporterSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return notFound("Job not found.");
    }

    const reporter = await prisma.reporter.findFirst({
      where: {
        availability: true,
        ...(body.data.reporterId
          ? { id: body.data.reporterId }
          : job.isRemote
            ? {}
            : { location: job.location }),
      },
      orderBy: body.data.reporterId ? undefined : { createdAt: "asc" },
    });

    const shouldFindFallbackReporter = body.data.reporterId || !job.isRemote;
    const fallbackReporter =
      reporter ??
      (shouldFindFallbackReporter
        ? await prisma.reporter.findFirst({
            where: { availability: true },
            orderBy: { createdAt: "asc" },
          })
        : null);

    if (!fallbackReporter) {
      return badRequest("No available reporter found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const shouldAdvance = job.status === JOB_STATUS.NEW;

      const next = await tx.job.update({
        where: { id },
        data: {
          reporterId: fallbackReporter.id,
          ...(shouldAdvance ? { status: JOB_STATUS.ASSIGNED } : {}),
        },
        include: jobInclude,
      });

      if (shouldAdvance) {
        await tx.jobStatusHistory.create({
          data: {
            jobId: id,
            fromStatus: JOB_STATUS.NEW,
            toStatus: JOB_STATUS.ASSIGNED,
            note: `Assigned reporter ${fallbackReporter.name}.`,
          },
        });
      }

      return next;
    });

    return ok(serializeJob(updated));
  } catch (error) {
    return serverError(error);
  }
}
