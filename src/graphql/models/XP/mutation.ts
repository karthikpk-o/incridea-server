import { builder } from "~/graphql/builder";

builder.mutationField("addXP", (t) =>
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

      const xp = await ctx.prisma.xP.findUnique({
        where: {
          userId_levelId: {
            userId: Number(user.id),
            levelId: Number(args.levelId),
          },
        },
      });
      if (xp) throw new Error("User already has xp for this level");

      const level = await ctx.prisma.level.findUnique({
        where: {
          id: Number(args.levelId),
        },
      });
      if (!level) throw new Error("Level not found");

      try {
        return await ctx.prisma.$transaction(async (db) => {
          await ctx.prisma.user.update({
            where: {
              id: Number(user.id),
            },
            data: {
              totalXp: user.totalXp + level.point,
            },
          });

          return await db.xP.create({
            data: {
              userId: Number(user.id),
              levelId: Number(args.levelId),
            },
            ...query,
          });
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't add xp");
      }
    },
  }),
);

builder.mutationField("useReferralCode", (t) =>
  t.prismaField({
    type: "User",
    args: {
      referralCode: t.arg({ type: "String", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not Authenticated");

      const referralUserId = args.referralCode.slice(-4);

      if (isNaN(Number(referralUserId)))
        throw new Error("Invalid Referral code format.");

      if (Number(referralUserId) === user.id)
        throw new Error(
          "Invalid Referral code: You cannot use your own referral code.",
        );

      const referredUser = await ctx.prisma.user.findUnique({
        where: { id: Number(referralUserId) },
      });
      if (!referredUser)
        throw new Error("Invalid Referral code: User not found.");

      const xpIncrement = 10;

      try {
        return await ctx.prisma.$transaction(async (db) => {
          await db.user.update({
            where: {
              id: Number(user.id),
            },
            data: {
              totalXp: {
                increment: xpIncrement / 2,
              },
            },
            ...query,
          });

          return await db.user.update({
            where: { id: Number(referralUserId) },
            data: { totalXp: referredUser.totalXp + xpIncrement },
            ...query,
          });
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't use referral code");
      }
    },
  }),
);
