import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default async function globalSetup() {
  const { PrismaPg } = await import("@prisma/adapter-pg");
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
}
