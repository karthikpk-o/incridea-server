import { prisma } from "~/utils/db";

const getChampionshipEligibilityForAllColleges = async (): Promise<
  Map<number, { isEligible: boolean; name: string; championshipPoints: number }>
> => {
  const finalRounds = await prisma.round.groupBy({
    by: ["eventId"],
    _max: { roundNo: true },
  });

  const finalRoundMap = new Map(
    finalRounds
      .filter((round) => round._max.roundNo !== null)
      .map((round) => [round.eventId, round._max.roundNo!]),
  );

  const eventParticipation = await prisma.team.findMany({
    where: {
      Event: {
        published: true,
        category: { in: ["TECHNICAL", "NON_TECHNICAL"] },
        Rounds: {
          some: {
            roundNo: { in: Array.from(finalRoundMap.values()) },
          },
        },
      },
    },
    select: {
      id: true,
      Event: {
        select: {
          id: true,
          category: true,
        },
      },
      TeamMembers: {
        select: {
          User: {
            select: { collegeId: true },
          },
        },
      },
    },
  });

  const collegeParticipationMap = new Map<
    number,
    { tech: number; nonTech: number }
  >();

  eventParticipation.forEach(({ TeamMembers, Event }) => {
    TeamMembers.forEach(({ User }) => {
      if (!User?.collegeId) return;

      const collegeId = User.collegeId;
      if (!collegeParticipationMap.has(collegeId)) {
        collegeParticipationMap.set(collegeId, { tech: 0, nonTech: 0 });
      }

      const counts = collegeParticipationMap.get(collegeId)!;
      if (Event.category === "TECHNICAL") counts.tech++;
      if (Event.category === "NON_TECHNICAL") counts.nonTech++;
    });
  });

  const colleges = await prisma.college.findMany({
    select: {
      id: true,
      name: true,
      championshipPoints: true,
    },
  });

  const eligibilityMap = new Map<
    number,
    { isEligible: boolean; name: string; championshipPoints: number }
  >();

  colleges.forEach((college) => {
    const counts = collegeParticipationMap.get(college.id) ?? {
      tech: 0,
      nonTech: 0,
    };
    eligibilityMap.set(college.id, {
      isEligible: counts.tech >= 3 && counts.nonTech >= 2,
      name: college.name,
      championshipPoints: college.championshipPoints,
    });
  });

  return eligibilityMap;
};

export { getChampionshipEligibilityForAllColleges };
