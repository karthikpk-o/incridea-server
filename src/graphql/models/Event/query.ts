import { builder } from "~/graphql/builder";

builder.queryField("events", (t) =>
  t.prismaConnection({
    type: "Event",
    // with pagination and filtering
    cursor: "id",
    args: {
      contains: t.arg({
        type: "String",
        required: false,
      }),
    },
    // TODO(Omkar): Intentionally didnt check for error handling, had no time to fix frontend code
    resolve: async (query, root, args, ctx, info) => {
      const filter = args.contains ?? "";
      try {
        return await ctx.prisma.event.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: filter,
                },
              },
              {
                description: {
                  contains: filter,
                },
              },
            ],
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch events");
      }
    },
  }),
);

builder.queryField("eventById", (t) =>
  t.prismaField({
    type: "Event",
    args: {
      id: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.id),
        },
        ...query,
      });

      if (!event) throw new Error("Event not found");

      if (event.published) return event;

      if (!user) throw new Error("Not authenticated");

      if (["ADMIN", "ORGANIZER", "BRANCH_REP"].includes(user.role))
        return event;

      throw new Error("Event not published");
    },
  }),
);

builder.queryField("registeredEvents", (t) =>
  t.prismaField({
    type: ["Event"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      try {
        return ctx.prisma.event.findMany({
          where: {
            Teams: {
              some: {
                TeamMembers: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            },
          },
          ...query,
          include: {
            Teams: {
              where: {
                TeamMembers: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch events");
      }
    },
  }),
);

builder.queryField("publishedEvents", (t) =>
  t.prismaField({
    type: ["Event"],
    resolve: async (query, root, args, ctx, info) => {
      // FIXME(Omkar): Is this a redundant DB query
      try {
        const core_event = await ctx.prisma.event.findMany({
          where: {
            AND: [
              {
                published: true,
              },
              {
                category: "CORE",
              },
            ],
          },
          orderBy: {
            name: "asc",
          },
          ...query,
        });
        const non_core_event = await ctx.prisma.event.findMany({
          where: {
            AND: [
              {
                published: true,
              },
              {
                NOT: {
                  category: "CORE",
                },
              },
            ],
          },
          orderBy: {
            name: "asc",
          },
          ...query,
        });
        return [...core_event, ...non_core_event];
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch published events",
        );
      }
    },
  }),
);

//completed events by checking if winners are present or not
// FIXME(Omkar): add event status in DB and merge with published field
builder.queryField("completedEvents", (t) =>
  t.prismaField({
    type: ["Event"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        const eventIds = await ctx.prisma.winners.findMany({
          select: {
            eventId: true,
          },
        });
        const events = await ctx.prisma.event.findMany({
          where: {
            id: {
              in: eventIds.map((event) => event.eventId),
            },
          },
          ...query,
        });
        return events;
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch completed events",
        );
      }
    },
  }),
);

// FIXME(Omkar): add event status in DB and merge with published field
class EventStatusClass {
  name: string;
  status: string;
  constructor(name: string, status: string) {
    this.name = name;
    this.status = status;
  }
}

const EventStatus = builder.objectType(EventStatusClass, {
  name: "EventStatus",
  fields: (t) => ({
    eventName: t.exposeString("name"),
    status: t.exposeString("status"),
  }),
});

builder.queryField("getEventStatus", (t) =>
  t.field({
    type: [EventStatus],
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "JURY" && user.role !== "ADMIN")
        throw new Error("Not authorized");

      try {
        const events = await ctx.prisma.event.findMany({
          where: {
            published: true,
          },
          include: {
            Rounds: { orderBy: { roundNo: "asc" } },
            Winner: true,
          },
        });

        const today = new Date();

        const eventStatuses = events.map((event) => {
          if (event.Winner.length > 0) {
            return new EventStatusClass(event.name, "EVENT COMPLETED");
          }

          const ongoingRound = event.Rounds.find(
            (round) =>
              round.date &&
              round.date.getTime() <= today.getTime() &&
              !round.completed,
          );

          if (ongoingRound) {
            return new EventStatusClass(
              event.name,
              `R${ongoingRound.roundNo} ONGOING`,
            );
          }

          const completedRounds = event.Rounds.filter(
            (round) => round.completed,
          ).sort((a, b) => b.roundNo - a.roundNo);

          const latestCompletedRound = completedRounds[0];

          const yetToStartRound = event.Rounds.filter(
            (round) => round.date && round.date.getTime() > today.getTime(),
          ).sort((a, b) => a.roundNo - b.roundNo)[0];

          if (latestCompletedRound && yetToStartRound) {
            return new EventStatusClass(
              event.name,
              `R${latestCompletedRound.roundNo} DONE, R${yetToStartRound.roundNo} YET TO START`,
            );
          }

          if (latestCompletedRound) {
            return new EventStatusClass(
              event.name,
              `R${latestCompletedRound.roundNo} DONE`,
            );
          }

          if (yetToStartRound) {
            return new EventStatusClass(
              event.name,
              `R${yetToStartRound.roundNo} YET TO START`,
            );
          }

          return new EventStatusClass(event.name, "NO ROUNDS");
        });

        return eventStatuses;
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch event status");
      }
    },
  }),
);
