import { builder } from "~/graphql/builder";

builder.queryField("judgeGetTeamsByRound", (t) =>
  t.prismaField({
    type: ["Team"],
    args: {
      eventId: t.arg.int({ required: true }),
      roundId: t.arg.int({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        return await ctx.prisma.team.findMany({
          where: {
            eventId: args.eventId,
            roundNo: {
              gte: args.roundId,
            },
            confirmed: true,
            attended: true,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch teams");
      }
    },
  }),
);
