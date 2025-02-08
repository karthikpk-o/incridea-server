import { builder } from "~/graphql/builder";

builder.queryField("colleges", (t) =>
  t.prismaField({
    type: ["College"],
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.college.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch colleges");
      }
    },
  }),
);
