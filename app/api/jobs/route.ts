import { Prisma } from "@/generated/prisma";
import { JOB_STATUS } from "@/lib/constants";
import { conflict, created, ok, serverError, validationError } from "@/lib/api";
import { jobInclude, serializeJob } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { getOrderBy, getPagination } from "@/lib/query";
import { jobCreateSchema, parseJson, parseListQuery } from "@/lib/validation";

const jobSorts = [
  "caseName",
  "durationMinutes",
  "location",
  "status",
  "isRemote",
  "createdAt",
  "editorFeeIdr",
] as const;

export async function GET(request: Request) {
  const query = parseListQuery(request.url);

  if (!query.success) {
    return validationError(query.error);
  }

  const { page, pageSize, search, sortBy, sortDir, location, status, isRemote } =
    query.data;

  const where: Prisma.JobWhereInput = {
    ...(location ? { location } : {}),
    ...(status === undefined ? {} : { status }),
    ...(isRemote === undefined ? {} : { isRemote }),
    ...(search
      ? {
          OR: [
            { caseName: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { reporter: { name: { contains: search, mode: "insensitive" } } },
            { editor: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  try {
    const [jobs, totalItems] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        orderBy: getOrderBy(sortBy, sortDir, jobSorts, "createdAt"),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: jobInclude,
      }),
      prisma.job.count({ where }),
    ]);

    return ok({
      data: jobs.map(serializeJob),
      pagination: getPagination(page, pageSize, totalItems),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const body = await parseJson(request, jobCreateSchema);

  if (!body.success) {
    return validationError(body.error);
  }

  try {
    const job = await prisma.$transaction(async (tx) => {
      const createdJob = await tx.job.create({
        data: {
          ...body.data,
          status: JOB_STATUS.NEW,
        },
        include: jobInclude,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId: createdJob.id,
          fromStatus: null,
          toStatus: JOB_STATUS.NEW,
          note: "Job created.",
        },
      });

      return tx.job.findUniqueOrThrow({
        where: { id: createdJob.id },
        include: jobInclude,
      });
    });

    return created(serializeJob(job));
  } catch {
    return conflict("Job could not be created.");
  }
}
