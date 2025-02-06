import { builder } from "~/graphql/builder";

builder.queryField("rounds", (t) =>
  t.prismaField({
    type: ["Round"],
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.round.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch rounds");
      }
    },
  }),
);

builder.queryField("roundsByEvent", (t) =>
  t.prismaField({
    type: ["Round"],
    args: {
      eventId: t.arg({ type: "ID", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.round.findMany({
          where: {
            eventId: Number(args.eventId),
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch rounds");
      }
    },
  }),
);
