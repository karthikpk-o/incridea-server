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
    // TODO(Omkar): Intentionally didnt check for error handling, had no time to fix frontend code
    resolve: (query, root, args, ctx, info) => {
      const filter = args.contains ?? "";
      return ctx.prisma.user.findMany({
        where: {
          role: {
            notIn: ["ADMIN", "JUDGE", "USER", "JURY"],
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
      if (!user) throw new Error("Not authenticated");

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
      try {
        return ctx.prisma.user.findUniqueOrThrow({
          where: {
            id: Number(args.id),
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch user details");
      }
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

const RegistrationCount = builder.objectType(RegistrationsCount, {
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
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      if (user.role !== "ADMIN") throw new Error("Not authorized");

      try {
        const internalRegistrations = await ctx.prisma.user.count({
          where: {
            role: {
              // Internal participant might be anything excpet these roles
              notIn: ["JUDGE", "USER"],
            },
            collegeId: CONSTANT.INTERNAL_COLLEGE_ID,
            ...(args.date
              ? {
                  createdAt: {
                    gte: args.date,
                    lte: new Date(args.date.getTime() + 86400000),
                  },
                }
              : args.last
                ? {
                    createdAt: {
                      gte: new Date(
                        new Date().getTime() - args.last * 86400000,
                      ).toISOString(),
                    },
                  }
                : {}),
          },
        });

        const externalRegistrations = await ctx.prisma.user.count({
          where: {
            role: {
              // External participant can only be these roles
              in: ["PARTICIPANT"],
            },
            collegeId: {
              not: CONSTANT.INTERNAL_COLLEGE_ID,
            },
            ...(args.date
              ? {
                  createdAt: {
                    gte: args.date,
                    lte: new Date(args.date.getTime() + 86400000),
                  },
                }
              : args.last
                ? {
                    createdAt: {
                      gte: new Date(
                        new Date().getTime() - args.last * 86400000,
                      ).toISOString(),
                    },
                  }
                : {}),
          },
        });

        return { internalRegistrations, externalRegistrations };
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch registrations count",
        );
      }
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
