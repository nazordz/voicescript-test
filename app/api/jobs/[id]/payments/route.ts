import { notFound, ok, validationError } from "@/lib/api";
import { jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { parseJson, paymentUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, paymentUpdateSchema);

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
