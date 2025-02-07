import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const main = async () => {
  await db.emailMonitor.create({
    data: {},
  });

  await db.college.create({
    data: {
      name: "NMAM Institute of Technology",
      type: "ENGINEERING",
    },
  });
};

main().catch(console.log);
