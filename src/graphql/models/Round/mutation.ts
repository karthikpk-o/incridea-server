import { builder } from "~/graphql/builder";

builder.mutationField("createRound", (t) =>
  t.prismaField({
    type: "Round",
    args: {
      eventId: t.arg.id({ required: true }),
      date: t.arg({ type: "DateTime", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER") throw new Error("Not authorized");

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
        include: {
          Organizers: true,
          Rounds: true,
        },
      });
      if (!event) throw new Error("Event not found");
      if (!event.Organizers.find((o) => o.userId === user.id))
        throw new Error("Not authorized");

      const roundNumber = event.Rounds.length + 1;

      try {
        return ctx.prisma.round.create({
          data: {
            roundNo: roundNumber,
            date: new Date(args.date),
            Event: {
              connect: {
                id: Number(args.eventId),
              },
            },
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create round");
      }
    },
  }),
);

builder.mutationField("deleteRound", (t) =>
  t.prismaField({
    type: "Round",
    args: {
      eventId: t.arg.id({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER") throw new Error("Not authorized");

      const lastRound = await ctx.prisma.round.findFirst({
        where: {
          eventId: Number(args.eventId),
        },
        orderBy: {
          roundNo: "desc",
        },
      });
      if (!lastRound) throw new Error("No rounds found");

      const round = await ctx.prisma.round.findUnique({
        where: {
          eventId_roundNo: {
            eventId: Number(args.eventId),
            roundNo: lastRound.roundNo,
          },
        },
        include: {
          Event: {
            include: {
              Organizers: true,
            },
          },
        },
      });
      if (!round) throw new Error("Round not found");
      if (!round.Event.Organizers.find((o) => o.userId === user.id))
        throw new Error("Not authorized");

      try {
        return ctx.prisma.round.delete({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: lastRound.roundNo,
            },
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't delete round");
      }
    },
  }),
);

builder.mutationField("completeRound", (t) =>
  t.prismaField({
    type: "Round",
    args: {
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg({ type: "Int", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "JUDGE") throw new Error("Not authorized");

      const round = await ctx.prisma.round.findUnique({
        where: {
          eventId_roundNo: {
            eventId: Number(args.eventId),
            roundNo: args.roundNo,
          },
        },
        include: {
          Judges: true,
        },
      });
      if (!round) throw new Error("Round not found");

      const judge = round.Judges.find((j) => j.userId === user.id);
      if (!judge) throw new Error("Not authorized");

      try {
        const data = await ctx.prisma.round.update({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: args.roundNo,
            },
          },
          data: {
            completed: true,
          },
        });

        return data;
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't complete round");
      }
    },
  }),
);

builder.mutationField("completeRoadiesRound", (t) =>
  t.prismaField({
    type: ["Team"],
    args: {
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg.id({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      if (user.role !== "JUDGE") throw new Error("Not authorized");

      try {
        return await ctx.prisma.$transaction(async (db) => {
          const nextRound = Number(args.roundNo) + 1;

          // Fetch teams with all team members
          const teams = await db.team.findMany({
            where: {
              eventId: Number(args.eventId),
              roundNo: nextRound,
              confirmed: true,
            },
            include: {
              TeamMembers: true,
            },
          });

          const createdTeams = [];

          for (const team of teams) {
            if (team.TeamMembers.length === 0) continue;

            // Create a new team for each team member
            for (let i = 0; i < team.TeamMembers.length; i++) {
              const member = team.TeamMembers[i];

              if (!member) continue;

              // Create new team with this member as leader
              const newTeam = await db.team.create({
                data: {
                  name: `${team.name}-${i + 1}`,
                  eventId: team.eventId,
                  roundNo: team.roundNo,
                  leaderId: member.userId, // Set this member as the leader
                  attended: team.attended,
                  confirmed: team.confirmed,
                  TeamMembers: {
                    create: {
                      userId: member.userId,
                    },
                  },
                },
                ...query,
              });

              createdTeams.push(newTeam);
            }

            // Delete the original team after creating new ones
            await db.team.delete({
              where: { id: team.id },
            });
          }

          // Mark the round as completed
          const round = await db.round.findUnique({
            where: {
              eventId_roundNo: {
                eventId: Number(args.eventId),
                roundNo: Number(args.roundNo),
              },
            },
            include: {
              Judges: true,
            },
          });

          if (!round) throw new Error("Round not found");

          const judge = round.Judges.find((j) => j.userId === user.id);
          if (!judge) throw new Error("Not authorized");

          try {
            await db.round.update({
              where: {
                eventId_roundNo: {
                  eventId: Number(args.eventId),
                  roundNo: Number(args.roundNo),
                },
              },
              data: {
                completed: true,
              },
            });
          } catch (e) {
            console.log(e);
            throw new Error("Something went wrong! Couldn't complete round");
          }

          return createdTeams;
        });
      } catch (error) {
        console.log(error);
        throw new Error("Something went wrong! Couldn't create teams");
      }
    },
  }),
);

builder.mutationField("changeSelectStatus", (t) =>
  t.prismaField({
    type: "Round",
    errors: {
      types: [Error],
    },
    args: {
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg({ type: "Int", required: true }),
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not Authenticated");
      if (user.role != "JUDGE") throw new Error("Not Authorized");

      const isJudge = await ctx.prisma.judge.findUnique({
        where: {
          userId_eventId_roundNo: {
            userId: user.id,
            eventId: Number(args.eventId),
            roundNo: args.roundNo,
          },
        },
      });
      if (!isJudge) throw new Error("Not Authorized");

      const round = await ctx.prisma.round.findUnique({
        where: {
          eventId_roundNo: {
            eventId: Number(args.eventId),
            roundNo: args.roundNo,
          },
        },
      });
      if (!round) throw new Error("Round not found");

      try {
        return await ctx.prisma.round.update({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: args.roundNo,
            },
          },
          data: {
            selectStatus: !round.selectStatus,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't change select status");
      }
    },
  }),
);
