import { Prisma } from "@/generated/prisma";
import { conflict, created, ok, serverError, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getOrderBy, getPagination } from "@/lib/query";
import { editorCreateSchema, parseJson, parseListQuery } from "@/lib/validation";

const editorSorts = ["name", "availability", "createdAt"] as const;

export async function GET(request: Request) {
  const query = parseListQuery(request.url);

  if (!query.success) {
    return validationError(query.error);
  }

  const { page, pageSize, search, sortBy, sortDir, availability } = query.data;

  const where: Prisma.EditorWhereInput = {
    ...(availability === undefined ? {} : { availability }),
    ...(search
      ? { name: { contains: search, mode: "insensitive" } }
      : {}),
  };

  try {
    const [data, totalItems] = await prisma.$transaction([
      prisma.editor.findMany({
        where,
        orderBy: getOrderBy(sortBy, sortDir, editorSorts, "createdAt"),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { jobs: true } } },
      }),
      prisma.editor.count({ where }),
    ]);

    return ok({ data, pagination: getPagination(page, pageSize, totalItems) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await parseJson(request, editorCreateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    return created(await prisma.editor.create({ data: body.data }));
  } catch {
    return conflict("Editor could not be created.");
  }
}
