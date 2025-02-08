import { builder } from "~/graphql/builder";

builder.mutationField("addBranchRep", (t) =>
  t.prismaField({
    type: "BranchRep",
    args: {
      branchId: t.arg({
        type: "ID",
        required: true,
      }),
      userId: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not Authenticated");
      if (user.role !== "ADMIN") throw new Error("No Permission");

      const branch = await ctx.prisma.branch.findUnique({
        where: {
          id: Number(args.branchId),
        },
      });
      if (!branch) throw new Error(`No Branch with id ${args.branchId}`);

      try {
        return ctx.prisma.$transaction(async (db) => {
          await db.user.update({
            where: {
              id: Number(args.userId),
            },
            data: {
              role: "BRANCH_REP",
            },
          });
          return await db.branchRep.create({
            data: {
              Branch: {
                connect: {
                  id: Number(args.branchId),
                },
              },
              User: {
                connect: {
                  id: Number(args.userId),
                },
              },
            },
          });
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't add Branch Rep");
      }
    },
  }),
);

builder.mutationField("removeBranchRep", (t) =>
  t.field({
    type: "String",
    args: {
      userId: t.arg({
        type: "ID",
        required: true,
      }),
      branchId: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ADMIN") throw new Error("No Permission");

      const branch = await ctx.prisma.branch.findUnique({
        where: {
          id: Number(args.branchId),
        },
      });
      if (!branch) throw new Error(`No Branch with id ${args.branchId}`);

      const branchRep = await ctx.prisma.branchRep.findUnique({
        where: {
          userId: Number(args.userId),
        },
      });
      if (!branchRep) throw new Error(`No Branch under user ${args.userId}`);
      if (branchRep.branchId !== branch.id) throw new Error(`No permission`);

      try {
        const successPaymentOrder = await ctx.prisma.paymentOrder.findMany({
          where: {
            userId: Number(args.userId),
            status: "SUCCESS",
          },
        });

        await ctx.prisma.$transaction(async (db) => {
          await db.user.update({
            where: {
              id: Number(args.userId),
            },
            data: {
              role: successPaymentOrder.length > 0 ? "PARTICIPANT" : "USER",
            },
          });

          await db.branchRep.delete({
            where: {
              userId: Number(args.userId),
            },
          });
        });

        return "Branch Rep has been Removed";
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't remove Branch Rep");
      }
    },
  }),
);
