import { prisma } from "~/utils/db";

type Tier = "DIAMOND" | "GOLD" | "SILVER" | "BRONZE";
type winnerType = "WINNER" | "RUNNER_UP" | "SECOND_RUNNER_UP";

type PointsTable = {
  [key in Tier]: {
    [key in winnerType]: number;
  };
};

const pointsTable: PointsTable = {
  DIAMOND: {
    WINNER: 600,
    RUNNER_UP: 550,
    SECOND_RUNNER_UP: 500,
  },
  GOLD: {
    WINNER: 450,
    RUNNER_UP: 400,
    SECOND_RUNNER_UP: 350,
  },
  SILVER: {
    WINNER: 300,
    RUNNER_UP: 250,
    SECOND_RUNNER_UP: 200,
  },
  BRONZE: {
    WINNER: 150,
    RUNNER_UP: 100,
    SECOND_RUNNER_UP: 50,
  },
};

const allocatePoints = (tier: Tier, winnerType: winnerType): number => {
  return pointsTable[tier][winnerType];
};

const checkChampionshipEligibility = async (
  collegeId: number,
): Promise<boolean> => {
  const finalRounds = await prisma.round.groupBy({
    by: ["eventId"],
    _max: { roundNo: true },
  });

  const eventFinalRoundMap = new Map(
    finalRounds
      .filter((round) => round._max.roundNo != null)
      .map((round) => [round.eventId, round._max.roundNo!]),
  );

  const users = await prisma.user.findMany({
    where: { collegeId: collegeId },
    select: { id: true },
  });

  const leaderIds = users.map((user) => user.id);

  const eligibilityTeams = await prisma.team.findMany({
    where: {
      leaderId: { in: leaderIds },
      Event: {
        published: true,
        category: {
          in: ["TECHNICAL", "NON_TECHNICAL"],
        },
        Rounds: {
          some: {
            roundNo: {
              in: Array.from(eventFinalRoundMap.values()),
            },
          },
        },
      },
    },
    include: {
      Event: true,
    },
  });

  const techCount = eligibilityTeams.filter(
    (team) => team.Event.category === "TECHNICAL",
  ).length;
  const nonTechCount = eligibilityTeams.filter(
    (team) => team.Event.category === "NON_TECHNICAL",
  ).length;
  return techCount >= 3 && nonTechCount >= 2;
};

export { allocatePoints, checkChampionshipEligibility };
