import { builder } from "~/graphql/builder";

builder.queryField("Revenue", (t) =>
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
          type: "FEST_REGISTRATION",
        },
      });

      return revenue._sum.amount ?? 0;
    },
  }),
);
