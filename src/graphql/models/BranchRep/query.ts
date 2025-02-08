import { builder } from "~/graphql/builder";

builder.queryField("eventsByBranchRep", (t) =>
  t.prismaField({
    type: ["Event"],
    args: {
      branchRepId: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.event.findMany({
          where: {
            Branch: {
              BranchReps: {
                some: {
                  userId: Number(args.branchRepId),
                },
              },
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch events by Branch Rep",
        );
      }
    },
  }),
);
