import { WinnerType } from "@prisma/client";

import { builder } from "~/graphql/builder";
import { prisma } from "~/utils/db";
import { CONSTANT } from "~/constants";

builder.mutationField("createWinner", (t) =>
  t.prismaField({
    type: "Winners",
    args: {
      teamId: t.arg({ type: "ID", required: true }),
      eventId: t.arg({ type: "ID", required: true }),
      type: t.arg({ type: WinnerType, required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      if (user.role !== "JUDGE") throw new Error("Not authorized");

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: Number(args.eventId),
          Rounds: {
            some: {
              Judges: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
        select: {
          tier: true,
          category: true,
          Rounds: {
            select: {
              completed: true,
              roundNo: true,
              Judges: true,
            },
          },
        },
      });
      if (!event) throw new Error("Not authorized");

      const total_rounds = event.Rounds.length;
      if (event.Rounds[total_rounds - 1]!.completed)
        throw new Error("Cant change round completed");

      // check if he is the judge of last round
      if (
        !event.Rounds[total_rounds - 1]!.Judges.some(
          (judge) => judge.userId === user.id,
        )
      )
        throw new Error("Not authorized");

      const team = await ctx.prisma.team.findUnique({
        where: {
          id: Number(args.teamId),
        },
        include: {
          TeamMembers: true,
        },
      });

      if (!team) throw new Error("Team not found");

      if (team.eventId !== Number(args.eventId))
        throw new Error("Team not found");

      if (team.roundNo !== total_rounds)
        throw new Error("Team not promoted to last round");

      const winner = await ctx.prisma.winners.findFirst({
        where: {
          type: args.type,
          eventId: Number(args.eventId),
          teamId: Number(args.teamId),
        },
      });
      if (winner) throw new Error("Winner already exists");

      try {
        return await ctx.prisma.$transaction(async (db) => {
          const data = await db.winners.create({
            data: {
              teamId: Number(args.teamId),
              eventId: Number(args.eventId),
              type: args.type,
            },
            ...query,
          });
          //check if winner level exists
          const levelExists = await db.level.findFirst({
            where: {
              winnerId: data.id,
            },
          });
          //get full team userId
          const teamMembers = team.TeamMembers.map((member) => member.userId);
          if (levelExists) {
            //check if team members are already given xp points
            const xp = await db.xP.findMany({
              where: {
                userId: {
                  in: teamMembers,
                },
                levelId: levelExists.id,
              },
            });
            if (xp.length == 0) {
              //give xp points to all team members
              await db.xP.createMany({
                data: teamMembers.map((userId) => ({
                  userId,
                  levelId: levelExists.id,
                })),
              });
            }
          } else {
            // give xp points for winning
            const point =
              CONSTANT.WINNER_POINTS.USER[event.category][args.type];

            const level = await db.level.create({
              data: {
                point: point,
                winnerId: data.id,
              },
            });
            //give xp points to all team members
            await db.xP.createMany({
              data: teamMembers.map((userId) => ({
                userId,
                levelId: level.id,
              })),
            });
          }

          const college = await db.user.findUnique({
            where: {
              id: team.leaderId ?? 0,
            },
            include: {
              College: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!college) throw new Error("College not found");

          const points =
            event.category !== "SPECIAL"
              ? CONSTANT.WINNER_POINTS.COLLEGE[event.tier][args.type]
              : 0;

          await db.college.update({
            where: {
              id: college.College?.id,
            },
            data: {
              championshipPoints: {
                increment: Number(points),
              },
            },
          });

          return data;
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create winners");
      }
    },
  }),
);

builder.mutationField("deleteWinner", (t) =>
  t.prismaField({
    type: "Winners",
    args: {
      id: t.arg({ type: "ID", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      if (user.role !== "JUDGE") throw new Error("Not authorized");

      const winner = await ctx.prisma.winners.findUnique({
        where: {
          id: Number(args.id),
        },
        include: {
          Team: {
            select: {
              leaderId: true,
              TeamMembers: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });
      if (!winner) throw new Error("Winner not found");

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: winner.eventId,
          Rounds: {
            some: {
              Judges: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
        select: {
          tier: true,
          category: true,
          Rounds: {
            select: {
              Judges: true,
              completed: true,
            },
          },
        },
      });
      if (!event) throw new Error("Not authorized");

      const total_rounds = event.Rounds.length;
      if (event.Rounds[total_rounds - 1]!.completed)
        throw new Error("Cant Change Round Completed");

      if (
        !event.Rounds[total_rounds - 1]!.Judges.some(
          (judge) => judge.userId === user.id,
        )
      )
        throw new Error("Not authorized");

      try {
        return await prisma.$transaction(async (db) => {
          //delete winner xp points
          const level = await db.level.findFirst({
            where: {
              winnerId: Number(args.id),
            },
          });
          //get all team members id
          const teamMembers = winner.Team.TeamMembers.map(
            (member) => member.userId,
          );

          if (level) {
            await db.xP.deleteMany({
              where: {
                userId: {
                  in: teamMembers,
                },
                levelId: level.id,
              },
            });
            await db.level.delete({
              where: {
                id: level.id,
              },
            });
          }

          const points =
            event.category !== "SPECIAL"
              ? CONSTANT.WINNER_POINTS.COLLEGE[event.tier][winner.type]
              : 0;

          const college = await db.user.findUnique({
            where: {
              id: winner.Team.leaderId ?? 0,
            },
            include: {
              College: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!college) throw new Error("College not found");

          await db.college.update({
            where: {
              id: college.College?.id,
            },
            data: {
              championshipPoints: {
                decrement: Number(points),
              },
            },
          });

          return await db.winners.delete({
            where: {
              id: Number(args.id),
            },
            ...query,
          });
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't delete winner");
      }
    },
  }),
);
