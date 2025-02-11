import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const main = async () => {
  await db.emailMonitor.create({
    data: {},
  });

  const college = await db.college.create({
    data: {
      name: "NMAM Institute of Technology",
      type: "ENGINEERING",
    },
  });

  await db.user.create({
    data: {
      email: "admin@incridea.in",
      name: "ADMIN",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("admin@123", 12),
      isVerified: true,
      role: "ADMIN",
    },
  });

  const branchRep = await db.user.create({
    data: {
      email: "branchrep@incridea.in",
      name: "BRANCHREP",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("branchrep@123", 12),
      isVerified: true,
      role: "BRANCH_REP",
    },
  });

  const branch = await db.branch.create({
    data: {
      name: "CSE",
      details: "Computer Science and Engineering",
    },
  });

  await db.branchRep.create({
    data: {
      Branch: {
        connect: {
          id: branch.id,
        },
      },
      User: {
        connect: {
          id: branchRep.id,
        },
      },
    },
  });

  const event = await db.event.create({
    data: {
      name: "Test Event",
      category: "CORE",
      // NOTE: RTE will parse description, which might lead to client build fails, hence this example RTE data is used in seed
      description: JSON.stringify({
        blocks: [
          {
            key: "de7u0",
            text: "This is the description for this test event",
            type: "unstyled",
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
          },
        ],
        entityMap: {},
      }),
      fees: 100,
      maxTeams: 10,
      minTeamSize: 2,
      maxTeamSize: 3,
      eventType: "INDIVIDUAL_MULTIPLE_ENTRY",
      image: "",
      published: true,
      venue: "Sadananda",
      Branch: {
        connect: {
          id: branch.id,
        },
      },
      Organizers: {
        create: {
          User: {
            create: {
              email: "organiser@incridea.in",
              name: "ORGANIZER",
              phoneNumber: "0000000000",
              password: await bcrypt.hash("organiser@123", 12),
              isVerified: true,
              role: "ORGANIZER",
              College: {
                connect: {
                  id: college.id,
                },
              },
            },
          },
        },
      },
    },
  });

  await db.round.createMany({
    data: [
      {
        roundNo: 1,
        eventId: event.id,
      },
      {
        roundNo: 2,
        eventId: event.id,
      },
    ],
  });

  const judge1 = await db.user.create({
    data: {
      email: "judge1@incridea.in",
      name: "JUDGE 1",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge1@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  const judge2 = await db.user.create({
    data: {
      email: "judge2@incridea.in",
      name: "JUDGE 2",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge2@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  const judge3 = await db.user.create({
    data: {
      email: "judge3@incridea.in",
      name: "JUDGE 3",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge3@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  await db.judge.createMany({
    data: [
      {
        eventId: event.id,
        roundNo: 1,
        userId: judge1.id,
      },
      {
        eventId: event.id,
        roundNo: 1,
        userId: judge2.id,
      },
      {
        eventId: event.id,
        roundNo: 2,
        userId: judge3.id,
      },
    ],
  });

  const teamMembers = [
    await db.user.create({
      data: {
        email: "participant1@incridea.in",
        name: "PARTICIPANT 1",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant1@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant2@incridea.in",
        name: "PARTICIPANT 2",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant2@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant3@incridea.in",
        name: "PARTICIPANT 3",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant3@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant4@incridea.in",
        name: "PARTICIPANT 4",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant4@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
  ] as const;

  await db.team.create({
    data: {
      name: "Test team 1",
      attended: true,
      confirmed: true,
      EventPaymentOrder: {
        create: {
          orderId: "1234",
          amount: 100,
          status: "SUCCESS",
          paymentData: { name: "Razorpay" },
        },
      },
      Event: {
        connect: {
          id: event.id,
        },
      },
      leaderId: teamMembers[0].id,
      TeamMembers: {
        createMany: {
          data: [
            {
              userId: teamMembers[0].id,
            },
            {
              userId: teamMembers[1].id,
            },
          ],
        },
      },
    },
  });

  await db.team.create({
    data: {
      name: "Test team 2",
      attended: true,
      confirmed: true,
      EventPaymentOrder: {
        create: {
          orderId: "2345",
          amount: 100,
          status: "SUCCESS",
          paymentData: { name: "Razorpay" },
        },
      },
      Event: {
        connect: {
          id: event.id,
        },
      },
      leaderId: teamMembers[2].id,
      TeamMembers: {
        createMany: {
          data: [
            {
              userId: teamMembers[2].id,
            },
            {
              userId: teamMembers[3].id,
            },
          ],
        },
      },
    },
  });
};

main().catch(console.log);
