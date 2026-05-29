import { Prisma } from "@/generated/prisma";
import { conflict, created, ok, serverError, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getOrderBy, getPagination } from "@/lib/query";
import {
  parseJson,
  parseListQuery,
  reporterCreateSchema,
} from "@/lib/validation";

const reporterSorts = ["name", "location", "availability", "createdAt"] as const;

export async function GET(request: Request) {
  const query = parseListQuery(request.url);

  if (!query.success) {
    return validationError(query.error);
  }

  const { page, pageSize, search, sortBy, sortDir, availability, location } =
    query.data;

  const where: Prisma.ReporterWhereInput = {
    ...(availability === undefined ? {} : { availability }),
    ...(location ? { location } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [data, totalItems] = await prisma.$transaction([
      prisma.reporter.findMany({
        where,
        orderBy: getOrderBy(sortBy, sortDir, reporterSorts, "createdAt"),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { jobs: true } } },
      }),
      prisma.reporter.count({ where }),
    ]);

    return ok({ data, pagination: getPagination(page, pageSize, totalItems) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await parseJson(request, reporterCreateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    return created(await prisma.reporter.create({ data: body.data }));
  } catch {
    return conflict("Reporter could not be created.");
  }
}
