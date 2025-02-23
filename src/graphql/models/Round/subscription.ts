import { builder } from "~/graphql/builder";

builder.queryField("getRoundStatus", (t) =>
  t.prismaField({
    type: "Round",
    args: {
      eventId: t.arg({ type: "ID", required: true }),
      roundNo: t.arg({ type: "Int", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.round.findUniqueOrThrow({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: Number(args.roundNo),
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch round status");
      }
    },
  }),
);
