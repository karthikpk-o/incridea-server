import { builder } from "~/graphql/builder";
import { prisma } from "~/utils/db";
import { checkChampionshipEligibility } from "./utils";

builder.queryField("winnersByEvent", (t) =>
  t.prismaField({
    type: ["Winners"],
    errors: {
      types: [Error],
    },
    args: {
      eventId: t.arg.id({ required: true }),
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not Authenticated");
      if (!["JUDGE", "JURY"].includes(user.role))
        throw new Error("You are not authorized");
      return ctx.prisma.winners.findMany({
        where: {
          eventId: Number(args.eventId),
        },
        ...query,
      });
    },
  }),
);

builder.queryField("allWinners", (t) =>
  t.prismaField({
    type: ["Winners"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not Authenticated");
      if (!["JUDGE", "JURY"].includes(user.role))
        throw new Error("You are not authorized");
      return ctx.prisma.winners.findMany({
        ...query,
      });
    },
  }),
);

class CountClass {
  WINNER: number;
  RUNNER_UP: number;
  SECOND_RUNNER_UP: number;
  constructor(WINNER: number, RUNNER_UP: number, SECOND_RUNNER_UP: number) {
    this.WINNER = WINNER;
    this.RUNNER_UP = RUNNER_UP;
    this.SECOND_RUNNER_UP = SECOND_RUNNER_UP;
  }
}

class ChampionshipPointsClass {
  collegeId: number;
  collegeName: string;
  championshipPoints: number;
  techCount: number;
  nonTechCount: number;
  coreCount: number;
  diamondCount: CountClass;
  goldCount: CountClass;
  silverCount: CountClass;
  bronzeCount: CountClass;
  isEligible: boolean;
  constructor(
    collegeId: number,
    isEligible: boolean,
    championshipPoints: number,
    collegeName: string,
    techCount: number,
    nonTechCount: number,
    coreCount: number,
    goldCount: CountClass,
    diamondCount: CountClass,
    silverCount: CountClass,
    bronzeCount: CountClass,
  ) {
    this.collegeName = collegeName;
    this.isEligible = isEligible;
    this.collegeId = collegeId;
    this.championshipPoints = championshipPoints;
    this.diamondCount = diamondCount;
    this.techCount = techCount;
    this.nonTechCount = nonTechCount;
    this.coreCount = coreCount;
    this.goldCount = goldCount;
    this.silverCount = silverCount;
    this.bronzeCount = bronzeCount;
  }
}

const Count = builder.objectType(CountClass, {
  name: "Counts",
  fields: (t) => ({
    winner: t.exposeInt("WINNER"),
    runner_up: t.exposeInt("RUNNER_UP"),
    second_runner_up: t.exposeInt("SECOND_RUNNER_UP"),
  }),
});

const ChampionshipPoints = builder.objectType(ChampionshipPointsClass, {
  name: "ChampionshipPoint",
  fields: (t) => ({
    id: t.exposeInt("collegeId"),
    name: t.exposeString("collegeName"),
    isEligible: t.exposeBoolean("isEligible"),
    championshipPoints: t.exposeInt("championshipPoints"),
    techCount: t.exposeInt("techCount"),
    nonTechCount: t.exposeInt("nonTechCount"),
    coreCount: t.exposeInt("coreCount"),
    diamondCount: t.expose("diamondCount", {
      type: Count,
    }),
    goldCount: t.expose("goldCount", {
      type: Count,
    }),
    silverCount: t.expose("silverCount", {
      type: Count,
    }),
    bronzeCount: t.expose("bronzeCount", {
      type: Count,
    }),
  }),
});

builder.queryField("getChampionshipLeaderboard", (t) =>
  t.field({
    type: [ChampionshipPoints],
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }
      if (user.role !== "JURY") {
        throw new Error("Not authorized");
      }

      const colleges = await prisma.college.findMany();

      const winners = await prisma.winners.findMany({
        include: {
          Team: {
            select: {
              leaderId: true,
            },
          },
          Event: {
            select: {
              tier: true,
              category: true,
            },
          },
        },
      });

      const collegePoints = await Promise.all(
        colleges.map(async (collegeItem) => {
          const IsEligible = await checkChampionshipEligibility(collegeItem.id);
          const eachCollegeData: ChampionshipPointsClass = {
            collegeId: collegeItem.id,
            isEligible: IsEligible,
            collegeName: collegeItem.name,
            championshipPoints: collegeItem.championshipPoints,
            techCount: 0,
            nonTechCount: 0,
            coreCount: 0,
            diamondCount: { WINNER: 0, RUNNER_UP: 0, SECOND_RUNNER_UP: 0 },
            goldCount: { WINNER: 0, RUNNER_UP: 0, SECOND_RUNNER_UP: 0 },
            silverCount: { WINNER: 0, RUNNER_UP: 0, SECOND_RUNNER_UP: 0 },
            bronzeCount: { WINNER: 0, RUNNER_UP: 0, SECOND_RUNNER_UP: 0 },
          };

          const collegeWinners = (
            await Promise.all(
              winners.map(async (winner) => {
                const leader = await ctx.prisma.user.findUnique({
                  where: {
                    id: winner.Team.leaderId ?? 0,
                  },
                });
                return leader?.collegeId === collegeItem.id ? winner : null;
              }),
            )
          ).filter((winner) => winner !== null);

          collegeWinners.forEach((winner) => {
            if (!winner.Event) return;

            if (winner.Event.category === "TECHNICAL") {
              eachCollegeData.techCount++;
            } else if (winner.Event.category === "NON_TECHNICAL") {
              eachCollegeData.nonTechCount++;
            } else if (winner.Event.category === "CORE") {
              eachCollegeData.coreCount++;
            }

            if (winner.Event.tier === "GOLD") {
              eachCollegeData.goldCount[winner.type]++;
            } else if (winner.Event.tier === "SILVER") {
              eachCollegeData.silverCount[winner.type]++;
            } else if (winner.Event.tier === "BRONZE") {
              eachCollegeData.bronzeCount[winner.type]++;
            } else if (winner.Event.tier === "DIAMOND") {
              eachCollegeData.diamondCount[winner.type]++;
            }
          });
          return eachCollegeData;
        }),
      );
      return collegePoints;
    },
  }),
);
