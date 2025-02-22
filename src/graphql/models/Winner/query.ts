import { builder } from "~/graphql/builder";
import { prisma } from "~/utils/db";
import { getChampionshipEligibilityForAllColleges } from "./utils";

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

      try {
        return ctx.prisma.winners.findMany({
          where: {
            eventId: Number(args.eventId),
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch winners");
      }
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

      try {
        return ctx.prisma.winners.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch winners");
      }
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
      if (!user) throw new Error("Not authenticated");

      if (user.role !== "JURY" && user.role !== "ADMIN")
        throw new Error("Not authorized");

      const eligibilityMap = await getChampionshipEligibilityForAllColleges();

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

      const leaderIds = [
        ...new Set(
          winners
            .map((w) => w.Team.leaderId)
            .filter((id): id is number => id !== null),
        ),
      ];

      const leaders = await prisma.user.findMany({
        where: { id: { in: leaderIds } },
        select: { id: true, collegeId: true },
      });

      const leaderCollegeMap = new Map(leaders.map((l) => [l.id, l.collegeId]));

      const collegePoints = Array.from(eligibilityMap.entries()).map(
        ([collegeId, { isEligible, name, championshipPoints }]) =>
          new ChampionshipPointsClass(
            collegeId,
            isEligible,
            championshipPoints,
            name,
            0,
            0,
            0,
            new CountClass(0, 0, 0),
            new CountClass(0, 0, 0),
            new CountClass(0, 0, 0),
            new CountClass(0, 0, 0),
          ),
      );

      winners.forEach((winner) => {
        if (!winner.Event) return;

        const collegeId = leaderCollegeMap.get(winner.Team.leaderId ?? 0);
        if (!collegeId) return;

        const collegeData = collegePoints.find(
          (c) => c.collegeId === collegeId,
        );
        if (!collegeData) return;

        if (winner.Event.category === "TECHNICAL") collegeData.techCount++;
        else if (winner.Event.category === "NON_TECHNICAL")
          collegeData.nonTechCount++;
        else if (winner.Event.category === "CORE") collegeData.coreCount++;

        if (winner.Event.tier === "GOLD") collegeData.goldCount[winner.type]++;
        else if (winner.Event.tier === "SILVER")
          collegeData.silverCount[winner.type]++;
        else if (winner.Event.tier === "BRONZE")
          collegeData.bronzeCount[winner.type]++;
        else if (winner.Event.tier === "DIAMOND")
          collegeData.diamondCount[winner.type]++;
      });

      return collegePoints;
    },
  }),
);
