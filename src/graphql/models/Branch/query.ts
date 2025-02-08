import { builder } from "~/graphql/builder";

builder.queryField("getBranch", (t) =>
  t.prismaField({
    type: "Branch",
    args: {
      id: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.branch.findUniqueOrThrow({
          where: {
            id: Number(args.id),
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch branch");
      }
    },
  }),
);

builder.queryField("getBranches", (t) =>
  t.prismaField({
    type: ["Branch"],
    errors: {
      types: [Error],
    },
    resolve: (query, root, args, ctx, info) => {
      try {
        return ctx.prisma.branch.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch branches");
      }
    },
  }),
);
