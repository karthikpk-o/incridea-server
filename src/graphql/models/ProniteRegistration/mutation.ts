import { CONSTANT } from "~/constants";
import { builder } from "~/graphql/builder";

builder.mutationField("registerPronite", (t) =>
  t.prismaField({
    type: "ProniteRegistration",
    args: {
      userId: t.arg.id(),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, parent, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.id != CONSTANT.ID_OF_PRONITE_SCANNING_USER)
        throw new Error("Not authorized to scan for pronite");

      const scannedUser = await ctx.prisma.user.findUnique({
        where: {
          id: Number(args.userId),
        },
      });
      if (!scannedUser) throw new Error("No such user exists");

      if (
        CONSTANT.PEOPLE_WHO_DONT_DESERVE_TO_BE_IN_PRONITE.includes(
          scannedUser.id,
        )
      )
        throw new Error("Does not deserve to register for pronite");

      if (
        !["PARTICIPANT", "ORGANIZER", "BRANCH_REP", "ADMIN", "JURY"].includes(
          scannedUser.role,
        )
      )
        throw new Error("User did not register for the fest");

      const pronite = await ctx.prisma.proniteRegistration.findUnique({
        where: {
          userId_proniteDay: {
            userId: Number(args.userId),
            proniteDay: new Date() < CONSTANT.PRONITE.DAY_2 ? "Day1" : "Day2",
          },
        },
      });

      if (pronite) {
        const date = new Date(pronite.createdAt).toLocaleString(undefined, {
          timeZone: "Asia/Kolkata",
        });
        throw new Error(`User already registered for pronite at ${date}`);
      }

      return await ctx.prisma.proniteRegistration.create({
        data: {
          userId: Number(args.userId),
          proniteDay: new Date() < CONSTANT.PRONITE.DAY_2 ? "Day1" : "Day2",
        },
        ...query,
      });
    },
  }),
);
