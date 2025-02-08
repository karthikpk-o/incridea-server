import { builder } from "~/graphql/builder";

builder.queryField("eventByOrganizer", (t) =>
  t.prismaField({
    type: ["Event"],
    args: {
      organizerId: t.arg({
        type: "ID",
        required: true,
      }),
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.event.findMany({
          where: {
            Organizers: {
              some: {
                userId: Number(args.organizerId),
              },
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch events by organiser",
        );
      }
    },
  }),
);
