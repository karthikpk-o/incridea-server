import { builder } from "~/graphql/builder";
import { CONSTANT } from "~/constants";

builder.queryField("users", (t) =>
  t.prismaConnection({
    type: "User",
    cursor: "id",
    args: {
      contains: t.arg({
        type: "String",
        required: false,
      }),
    },
    resolve: (query, root, args, ctx, info) => {
      const filter = args.contains ?? "";
      return ctx.prisma.user.findMany({
        where: {
          role: {
            // TODO(Omkar): add "USER in the follwing list"
            notIn: ["ADMIN", "JUDGE", "JURY"],
          },
          OR: [
            {
              email: {
                contains: filter,
              },
            },
            {
              name: {
                contains: filter,
              },
            },
            filter !== "" && !isNaN(Number(filter))
              ? {
                  id: Number(filter),
                }
              : {},
          ],
        },
        ...query,
      });
    },
  }),
);

builder.queryField("me", (t) =>
  t.prismaField({
    type: "User",
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }
      return user;
    },
  }),
);

builder.queryField("userById", (t) =>
  t.prismaField({
    type: "User",
    args: {
      id: t.arg({ type: "ID", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      return ctx.prisma.user.findUniqueOrThrow({
        where: {
          id: Number(args.id),
        },
      });
    },
  }),
);

class RegistrationsCount {
  internalRegistrations: number;
  externalRegistrations: number;
  constructor(internalRegistrations: number, externalRegistrations: number) {
    this.internalRegistrations = internalRegistrations;
    this.externalRegistrations = externalRegistrations;
  }
}

export const RegistrationCount = builder.objectType(RegistrationsCount, {
  name: "EventRegistrationsCount",
  fields: (t) => ({
    internalRegistrations: t.exposeInt("internalRegistrations"),
    externalRegistrations: t.exposeInt("externalRegistrations"),
  }),
});

builder.queryField("getTotalRegistrations", (t) =>
  t.field({
    type: RegistrationCount,
    args: {
      date: t.arg({ type: "DateTime", required: false }),
      last: t.arg({ type: "Int", required: false }),
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }
      if (user.role !== "JURY" && user.role !== "ADMIN") {
        throw new Error("Not authorized");
      }
      let dateFilter = {};

      if (args.date) {
        dateFilter = {
          createdAt: {
            gte: args.date,
            lte: new Date(args.date.getTime() + 86400000),
          },
        };
      } else if (args.last) {
        dateFilter = {
          createdAt: {
            gte: new Date(
              new Date().getTime() - args.last * 86400000,
            ).toISOString(),
          },
        };
      }

      const internalRegistrations = await ctx.prisma.user.count({
        where: {
          role: {
            in: ["PARTICIPANT", "ORGANIZER", "BRANCH_REP"],
          },
          collegeId: 1,
          ...dateFilter,
        },
      });

      const externalRegistrations = await ctx.prisma.user.count({
        where: {
          role: {
            in: ["PARTICIPANT"],
          },
          collegeId: { not: 1 },
          ...dateFilter,
        },
      });

      return { internalRegistrations, externalRegistrations };
    },
  }),
);

builder.queryField("getAvatars", (t) =>
  t.field({
    type: ["Avatar"],
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      return CONSTANT.AVATARS;
    },
  }),
);

builder.queryField("getStoneVisibilities", (t) =>
  t.field({
    type: "String",
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      return user.stoneVisibilities;
    },
  }),
);
