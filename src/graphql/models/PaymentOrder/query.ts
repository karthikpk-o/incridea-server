import { builder } from "~/graphql/builder";

builder.queryField("getRevenue", (t) =>
  t.int({
    errors: {
      types: [Error],
    },
    resolve: async (query, args, ctx, info) => {
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
