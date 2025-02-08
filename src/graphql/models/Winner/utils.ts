import { prisma } from "~/utils/db";

// TODO(Omkar): Might be too heavy of a query need refactor
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

export { checkChampionshipEligibility };
