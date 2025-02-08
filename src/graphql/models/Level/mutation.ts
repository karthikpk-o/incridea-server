import { builder } from "~/graphql/builder";

builder.mutationField("addLevel", (t) =>
  t.prismaField({
    type: "Level",
    args: {
      point: t.arg({ type: "Int", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ADMIN") throw new Error("Not authorized");

      try {
        return await ctx.prisma.level.create({
          data: {
            point: args.point,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't add level");
      }
    },
  }),
);
