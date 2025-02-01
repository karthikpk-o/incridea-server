import { builder } from "~/graphql/builder";

class ProniteRegistrationCounts {
  day1Count: number;
  day2Count: number;
  constructor(day1Count: number, day2Count: number) {
    this.day1Count = day1Count;
    this.day2Count = day2Count;
  }
}

const proniteCount = builder.objectType(ProniteRegistrationCounts, {
  name: "ProniteRegistrationCounts",
  fields: (t) => ({
    day1Count: t.exposeInt("day1Count"),
    day2Count: t.exposeInt("day2Count"),
  }),
});

builder.queryField("getProniteRegistrations", (t) =>
  t.field({
    type: proniteCount,
    resolve: async (root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }
      if (user.role !== "JURY" && user.role !== "ADMIN") {
        throw new Error("Not authorized");
      }
      const day1Count = await ctx.prisma.proniteRegistration.count({
        where: {
          proniteDay: "Day1",
        },
      });
      const day2Count = await ctx.prisma.proniteRegistration.count({
        where: {
          proniteDay: "Day2",
        },
      });
      return { day1Count, day2Count };
    },
  }),
);
