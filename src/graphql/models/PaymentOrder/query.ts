import { builder } from "~/graphql/builder";

builder.queryField("getRevenue", (t) =>
  t.field({
    type: "Int",
    errors: {
      types: [Error],
    },
    resolve: async (query, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "JURY" && user.role !== "ADMIN")
        throw new Error("Not authorized");

      try {
        const revenue = await ctx.prisma.paymentOrder.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            AND: [
              {
                type: "FEST_REGISTRATION",
              },
              {
                status: "SUCCESS",
              },
            ],
          },
        });

        return revenue._sum.amount ?? 0;
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch revenue");
      }
    },
  }),
);
