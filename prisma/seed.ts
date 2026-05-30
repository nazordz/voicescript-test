import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const JOB_STATUS = {
  NEW: 0,
  ASSIGNED: 1,
  TRANSCRIBED: 2,
  REVIEWED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
} as const;

async function main() {
  await prisma.jobStatusHistory.deleteMany();
  await prisma.job.deleteMany();
  await prisma.reporter.deleteMany();
  await prisma.editor.deleteMany();

  const reporters = await prisma.reporter.createManyAndReturn({
    data: [
      { name: "Dewi Lestari", location: "Jakarta", availability: true },
      { name: "Rizky Pratama", location: "Bandung", availability: true },
      { name: "Siti Nurhaliza", location: "Surabaya", availability: true },
      { name: "Bima Santoso", location: "Yogyakarta", availability: false },
      { name: "Maya Kartika", location: "Medan", availability: true },
      { name: "Wayan Putra", location: "Denpasar", availability: false },
    ],
  });

  const editors = await prisma.editor.createManyAndReturn({
    data: [
      { name: "Ayu Maharani", availability: true },
      { name: "Fajar Nugroho", availability: true },
      { name: "Nadia Saputri", availability: false },
      { name: "Teguh Wibowo", availability: true },
    ],
  });

  const reporterByLocation = new Map(
    reporters.map((reporter) => [reporter.location, reporter]),
  );
  const editorByName = new Map(editors.map((editor) => [editor.name, editor]));

  const jakartaReporter = reporterByLocation.get("Jakarta");
  const bandungReporter = reporterByLocation.get("Bandung");
  const surabayaReporter = reporterByLocation.get("Surabaya");
  const ayuEditor = editorByName.get("Ayu Maharani");
  const fajarEditor = editorByName.get("Fajar Nugroho");
  const teguhEditor = editorByName.get("Teguh Wibowo");

  if (
    !jakartaReporter ||
    !bandungReporter ||
    !surabayaReporter ||
    !ayuEditor ||
    !fajarEditor ||
    !teguhEditor
  ) {
    throw new Error("Seed data lookup failed.");
  }

  const newJob = await prisma.job.create({
    data: {
      caseName: "State vs. Hartono",
      durationMinutes: 45,
      location: "Jakarta",
      status: JOB_STATUS.NEW,
      isRemote: false,
    },
  });

  const assignedJob = await prisma.job.create({
    data: {
      caseName: "Civil Hearing PT Nusantara",
      durationMinutes: 90,
      location: "Bandung",
      status: JOB_STATUS.ASSIGNED,
      reporterId: bandungReporter.id,
      isRemote: false,
    },
  });

  const transcribedJob = await prisma.job.create({
    data: {
      caseName: "Remote Deposition Amelia Tan",
      durationMinutes: 60,
      location: "Denpasar",
      status: JOB_STATUS.TRANSCRIBED,
      reporterId: jakartaReporter.id,
      isRemote: true,
    },
  });

  const reviewedJob = await prisma.job.create({
    data: {
      caseName: "Commercial Dispute Surabaya",
      durationMinutes: 120,
      location: "Surabaya",
      status: JOB_STATUS.REVIEWED,
      reporterId: surabayaReporter.id,
      editorId: ayuEditor.id,
      isRemote: false,
      editorFeeIdr: 75000,
    },
  });

  const completedJob = await prisma.job.create({
    data: {
      caseName: "Labor Arbitration Medan",
      durationMinutes: 75,
      location: "Medan",
      status: JOB_STATUS.COMPLETED,
      reporterId: jakartaReporter.id,
      editorId: fajarEditor.id,
      isRemote: true,
    },
  });

  const cancelledJob = await prisma.job.create({
    data: {
      caseName: "Withdrawn Hearing Semarang",
      durationMinutes: 30,
      location: "Semarang",
      status: JOB_STATUS.CANCELLED,
      reporterId: bandungReporter.id,
      isRemote: false,
    },
  });

  await prisma.jobStatusHistory.createMany({
    data: [
      {
        jobId: newJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Job created.",
      },
      {
        jobId: assignedJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Job created.",
      },
      {
        jobId: assignedJob.id,
        fromStatus: JOB_STATUS.NEW,
        toStatus: JOB_STATUS.ASSIGNED,
        note: "Assigned to Bandung reporter.",
      },
      {
        jobId: transcribedJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Remote job created.",
      },
      {
        jobId: transcribedJob.id,
        fromStatus: JOB_STATUS.NEW,
        toStatus: JOB_STATUS.ASSIGNED,
        note: "Assigned to remote-capable reporter.",
      },
      {
        jobId: transcribedJob.id,
        fromStatus: JOB_STATUS.ASSIGNED,
        toStatus: JOB_STATUS.TRANSCRIBED,
        note: "Reporter submitted transcript.",
      },
      {
        jobId: reviewedJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Job created.",
      },
      {
        jobId: reviewedJob.id,
        fromStatus: JOB_STATUS.NEW,
        toStatus: JOB_STATUS.ASSIGNED,
        note: "Assigned to same-city reporter.",
      },
      {
        jobId: reviewedJob.id,
        fromStatus: JOB_STATUS.ASSIGNED,
        toStatus: JOB_STATUS.TRANSCRIBED,
        note: "Transcript submitted.",
      },
      {
        jobId: reviewedJob.id,
        fromStatus: JOB_STATUS.TRANSCRIBED,
        toStatus: JOB_STATUS.REVIEWED,
        note: "Editor completed review with custom fee.",
      },
      {
        jobId: completedJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Remote job created.",
      },
      {
        jobId: completedJob.id,
        fromStatus: JOB_STATUS.NEW,
        toStatus: JOB_STATUS.ASSIGNED,
        note: "Assigned to remote reporter.",
      },
      {
        jobId: completedJob.id,
        fromStatus: JOB_STATUS.ASSIGNED,
        toStatus: JOB_STATUS.TRANSCRIBED,
        note: "Transcript submitted.",
      },
      {
        jobId: completedJob.id,
        fromStatus: JOB_STATUS.TRANSCRIBED,
        toStatus: JOB_STATUS.REVIEWED,
        note: "Editor review completed.",
      },
      {
        jobId: completedJob.id,
        fromStatus: JOB_STATUS.REVIEWED,
        toStatus: JOB_STATUS.COMPLETED,
        note: "Payment finalized.",
      },
      {
        jobId: cancelledJob.id,
        fromStatus: null,
        toStatus: JOB_STATUS.NEW,
        note: "Job created.",
      },
      {
        jobId: cancelledJob.id,
        fromStatus: JOB_STATUS.NEW,
        toStatus: JOB_STATUS.ASSIGNED,
        note: "Assigned to Bandung reporter.",
      },
      {
        jobId: cancelledJob.id,
        fromStatus: JOB_STATUS.ASSIGNED,
        toStatus: JOB_STATUS.CANCELLED,
        note: "Hearing withdrawn by the court.",
      },
    ],
  });

  await prisma.job.update({
    where: { id: transcribedJob.id },
    data: { editorId: teguhEditor.id },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
