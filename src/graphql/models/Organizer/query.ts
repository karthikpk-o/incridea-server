import { builder } from "~/graphql/builder";

builder.queryField("eventByOrganizer", (t) =>
  t.prismaField({
    type: ["Event"],
    errors: {
      types: [Error]
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;

      if (!user) throw new Error("You are not authenticated");

      if (user.role !== "ADMIN" && user.role !== "ORGANIZER")
        throw new Error("You are not allowed to perform this action");

      try {
        return ctx.prisma.event.findMany({
          where: {
            Organizers: {
              some: {
                userId: user.id,
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
