import { CONSTANT } from "~/constants";
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
      if (user.role !== "ADMIN") throw new Error("Not authorized");

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

class RegistrationsVSDateClass {
  internalRegistrations: number;
  externalRegistrations: number;
  date: string;

  constructor(
    internalRegistrations: number,
    externalRegistrations: number,
    date: string,
  ) {
    this.internalRegistrations = internalRegistrations;
    this.externalRegistrations = externalRegistrations;
    this.date = date;
  }
}

const RegistrationVSDate = builder.objectType(RegistrationsVSDateClass, {
  name: "RegistrationVSDateObject",
  fields: (t) => ({
    internalRegistrations: t.exposeInt("internalRegistrations"),
    externalRegistrations: t.exposeInt("externalRegistrations"),
    date: t.exposeString("date"),
  }),
});

builder.queryField("getRegistrationvsDate", (t) =>
  t.field({
    type: [RegistrationVSDate],
    args: {
      date: t.arg({ type: "DateTime", required: false }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ADMIN") throw new Error("Not authorized");

      try {
        const isSpecificDate = Boolean(args.date);

        const allPaymentOrders = await ctx.prisma.paymentOrder.groupBy({
          by: ["createdAt"],
          where: {
            status: "SUCCESS",
            type: "FEST_REGISTRATION",
            ...(args.date
              ? {
                  createdAt: {
                    gte: args.date,
                    lte: new Date(args.date.getTime() + 86400000),
                  },
                }
              : {}),
          },
          _count: {
            id: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        const internalPaymentOrders = await ctx.prisma.paymentOrder.groupBy({
          by: ["createdAt"],
          where: {
            status: "SUCCESS",
            type: "FEST_REGISTRATION",
            ...(args.date
              ? {
                  createdAt: {
                    gte: args.date,
                    lte: new Date(args.date.getTime() + 86400000),
                  },
                }
              : {}),
            User: {
              College: {
                id: CONSTANT.INTERNAL_COLLEGE_ID,
              },
            },
          },
          _count: {
            id: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        const groupedData = new Map<
          string,
          { internal: number; external: number }
        >();

        allPaymentOrders.forEach((entry) => {
          const dateKey = isSpecificDate
            ? entry.createdAt.toISOString().slice(0, 13)
            : entry.createdAt.toISOString().split("T")[0];

          if (dateKey) {
            if (!groupedData.has(dateKey)) {
              groupedData.set(dateKey, { internal: 0, external: 0 });
            }
            groupedData.get(dateKey)!.external += entry._count.id;
          }
        });

        internalPaymentOrders.forEach((entry) => {
          const dateKey = isSpecificDate
            ? entry.createdAt.toISOString().slice(0, 13)
            : entry.createdAt.toISOString().split("T")[0];

          if (dateKey) {
            if (groupedData.has(dateKey)) {
              groupedData.get(dateKey)!.internal += entry._count.id;
              groupedData.get(dateKey)!.external = Math.max(
                groupedData.get(dateKey)!.external - entry._count.id,
                0,
              );
            }
          }
        });

        return Array.from(groupedData.entries()).map(
          ([date, { internal, external }]) =>
            new RegistrationsVSDateClass(internal, Math.max(external, 0), date),
        );
      } catch (e) {
        console.error(e);
        throw new Error("Something went wrong! Couldn't fetch chart data");
      }
    },
  }),
);
