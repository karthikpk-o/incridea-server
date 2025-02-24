import { builder } from "~/graphql/builder";

builder.queryField("judgeCountByJudge", (t) =>
  t.field({
    type: "Int",
    errors: {
      types: [Error],
    },
    resolve: async (parent, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "JUDGE") throw new Error("Not authorized");

      try {
        const round = await ctx.prisma.round.findFirstOrThrow({
          where: {
            Judges: {
              some: {
                userId: user.id,
              },
            },
          },
        });

        return await ctx.prisma.judge.count({
          where: {
            AND: [
              {
                eventId: round.eventId,
              },
              {
                roundNo: round.roundNo,
              },
            ],
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch judge count");
      }
    },
  }),
);

builder.queryField("roundByJudge", (t) =>
  t.prismaField({
    type: "Round",
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "JUDGE") throw new Error("Not authorized");

      try {
        return await ctx.prisma.round.findFirstOrThrow({
          where: {
            Judges: {
              some: {
                userId: user.id,
              },
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch round");
      }
    },
  }),
);
