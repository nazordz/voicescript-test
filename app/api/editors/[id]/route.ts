import { conflict, noContent, notFound, ok, serverError, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { editorUpdateSchema, parseJson } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const editor = await prisma.editor.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    });

    return editor ? ok(editor) : notFound("Editor not found.");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJson(request, editorUpdateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    return ok(await prisma.editor.update({ where: { id }, data: body.data }));
  } catch {
    return notFound("Editor not found.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const jobCount = await prisma.job.count({ where: { editorId: id } });

    if (jobCount > 0) {
      return conflict("Editor is referenced by jobs and cannot be deleted.");
    }

    await prisma.editor.delete({ where: { id } });
    return noContent();
  } catch {
    return notFound("Editor not found.");
  }
}
