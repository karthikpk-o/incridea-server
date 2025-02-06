import bcrypt from "bcryptjs";

import { builder } from "~/graphql/builder";

builder.mutationField("createJudge", (t) =>
  t.prismaField({
    type: "Judge",
    args: {
      name: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg.int({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER") throw new Error("Not authorized");

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
        include: {
          Organizers: true,
        },
      });
      if (!event) throw new Error("Event not found");
      if (!event.Organizers.find((o) => o.userId === user.id))
        throw new Error("Not authorized");

      if (!args.email.endsWith("@incridea.in"))
        throw new Error("Judge email should end with @incridea.in");

      try {
        return await ctx.prisma.judge.create({
          data: {
            User: {
              create: {
                name: args.name,
                email: args.email,
                phoneNumber: "0000000000",
                password: await bcrypt.hash(args.password, 12),
                role: "JUDGE",
                isVerified: true,
              },
            },
            Round: {
              connect: {
                eventId_roundNo: {
                  eventId: Number(args.eventId),
                  roundNo: Number(args.roundNo),
                },
              },
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create judge");
      }
    },
  }),
);

builder.mutationField("deleteJudge", (t) =>
  t.prismaField({
    type: "Judge",
    args: {
      userId: t.arg.id({ required: true }),
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg.int({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER") throw new Error("Not authorized");

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
        include: {
          Organizers: true,
        },
      });
      if (!event) throw new Error("Event not found");
      if (!event.Organizers.find((o) => o.userId === user.id))
        throw new Error("Not authorized");

      try {
        return await ctx.prisma.$transaction(async (db) => {
          const judge = await db.judge.delete({
            where: {
              userId_eventId_roundNo: {
                userId: Number(args.userId),
                eventId: Number(args.eventId),
                roundNo: Number(args.roundNo),
              },
            },
            ...query,
          });
          await db.user.delete({
            where: {
              id: Number(args.userId),
            },
          });
          return judge;
        });
      } catch (err) {
        console.log(err);
        throw new Error("Something went wrong! Couldn't delete judge");
      }
    },
  }),
);
