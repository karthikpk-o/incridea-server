import { builder } from "~/graphql/builder";

builder.queryField("getLevelXp", (t) =>
  t.prismaField({
    type: "Level",
    args: {
      levelId: t.arg({ type: "ID", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      try {
        return await ctx.prisma.level.findUniqueOrThrow({
          where: {
            id: Number(args.levelId),
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch level");
      }
    },
  }),
);
