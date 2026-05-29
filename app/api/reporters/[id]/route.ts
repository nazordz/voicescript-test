import { notFound, noContent, ok, serverError, validationError, conflict } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseJson, reporterUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const reporter = await prisma.reporter.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });

    return reporter ? ok(reporter) : notFound("Reporter not found.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, reporterUpdateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    return ok(await prisma.reporter.update({ where: { id }, data: body.data }));
  } catch {
    return notFound("Reporter not found.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const jobCount = await prisma.job.count({ where: { reporterId: id } });

    if (jobCount > 0) {
      return conflict("Reporter is referenced by jobs and cannot be deleted.");
    }

    await prisma.reporter.delete({ where: { id } });
    return noContent();
  } catch {
    return notFound("Reporter not found.");
  }
}
