import { builder } from "~/graphql/builder";

builder.queryField("getRevenue", (t) =>
  t.int({
    errors: {
      types: [Error],
    },
    resolve: async (query, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }
      if (user.role !== "JURY" && user.role !== "ADMIN") {
        throw new Error("Not authorized");
      }
      const revenue = await ctx.prisma.paymentOrder.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          AND: [{ type: "FEST_REGISTRATION" }, { status: "SUCCESS" }],
        },
      });

      return revenue._sum.amount ?? 0;
    },
  }),
);
