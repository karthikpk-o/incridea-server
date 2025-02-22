import { builder } from "~/graphql/builder";

builder.queryField("getUserXp", (t) =>
  t.prismaField({
    type: ["XP"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      try {
        return await ctx.prisma.xP.findMany({
          where: {
            userId: Number(user.id),
          },
          include: {
            Level: true,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't get xp");
      }
    },
  }),
);

builder.queryField("getUserLevelScore", (t) =>
  t.prismaField({
    type: "XP",
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
        return await ctx.prisma.xP.findUniqueOrThrow({
          where: {
            userId_levelId: {
              userId: Number(user.id),
              levelId: Number(args.levelId),
            },
          },
          include: {
            Level: true,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't get level score");
      }
    },
  }),
);

builder.queryField("getXpLeaderboard", (t) =>
  t.prismaField({
    type: ["XP"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        return await ctx.prisma.xP.findMany({
          where: {
            User: {
              role: {
                not: "USER",
              },
            },
          },
          include: {
            User: true,
            Level: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't get leaderboard");
      }
    },
  }),
);
