import { test } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";

test("reset database between projects", async () => {
  const { PrismaClient } = await import("../generated/prisma/index.js");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    await prisma.jobStatusHistory.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.reporter.deleteMany({});
    await prisma.editor.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
});
