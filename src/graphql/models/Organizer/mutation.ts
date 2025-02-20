import { builder } from "~/graphql/builder";

builder.mutationField("addOrganizer", (t) =>
  t.prismaField({
    type: "Organizer",
    args: {
      eventId: t.arg({
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
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "BRANCH_REP") throw new Error("No Permission");

      const branch = await ctx.prisma.branchRep.findUnique({
        where: {
          userId: user.id,
        },
      });
      if (!branch) throw new Error(`No Branch Under ${user.name}`);

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
      });
      if (!event) throw new Error(`No Event with id ${args.eventId}`);
      if (event.branchId !== branch.branchId) throw new Error(`No Permission`);

      const organiserUser = await ctx.prisma.user.findUnique({
        where: {
          id: Number(args.userId),
        },
      });
      if (!organiserUser) throw new Error("Organiser user not found");
      if (organiserUser.role !== "PARTICIPANT" && organiserUser.role !== "ORGANIZER")
        throw new Error("User has to pay for the fest to be an organiser");

      try {
        return await ctx.prisma.$transaction(async (db) => {
          await db.user.update({
            where: {
              id: Number(args.userId),
            },
            data: {
              role: "ORGANIZER",
            },
          });
          return await db.organizer.create({
            data: {
              Event: {
                connect: {
                  id: Number(args.eventId),
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
        throw new Error("Something went wrong! Couldn't add organiser");
      }
    },
  }),
);

builder.mutationField("removeOrganizer", (t) =>
  t.field({
    type: "String",
    args: {
      eventId: t.arg({
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
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "BRANCH_REP") throw new Error("No Permission");

      const branch = await ctx.prisma.branchRep.findUnique({
        where: {
          userId: user.id,
        },
      });
      if (!branch) throw new Error(`No Branch Under ${user.name}`);

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
      });
      if (!event) throw new Error(`No Event with id ${args.eventId}`);
      if (event.branchId !== branch.branchId) throw new Error(`No Permission`);

      const organiserUser = await ctx.prisma.user.findUnique({
        where: {
          id: Number(args.userId),
        },
      });
      if (!organiserUser) throw new Error("Organiser user not found");

      const count = await ctx.prisma.organizer.count({
        where: {
          userId: Number(args.userId),
        },
      });

      const successPaymentOrder = await ctx.prisma.paymentOrder.findMany({
        where: {
          userId: Number(args.userId),
          status: "SUCCESS",
        },
      });

      try {
        // What if user has ORGANISER role but not an organiser
        // or user is a ORGANISER for only 1 event
        if (organiserUser.role === "ORGANIZER" && !(count > 1)) {
          await ctx.prisma.user.update({
            where: {
              id: Number(args.userId),
            },
            data: {
              role: successPaymentOrder.length > 0 ? "PARTICIPANT" : "USER",
            },
          });
        }

        await ctx.prisma.organizer.delete({
          where: {
            userId_eventId: {
              userId: Number(args.userId),
              eventId: Number(args.eventId),
            },
          },
        });

        return "Removed Organizer";
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't remove organiser");
      }
    },
  }),
);
