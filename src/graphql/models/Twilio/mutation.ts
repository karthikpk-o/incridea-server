import { builder } from "~/graphql/builder";
import { sendWhatsAppMessage } from "~/services/twilio.service";

builder.mutationField("sendEventRegistrationReminder", (t) =>
  t.field({
    type: "Boolean",
    args: {
      eventId: t.arg.id({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      try {
        const user = await ctx.user;
        if (!user) {
          throw new Error("Not authenticated");
        }
        if (user.role !== "ORGANIZER") {
          throw new Error("Not authorized to send WhatsApp notifications");
        }

        const event = await ctx.prisma.event.findUnique({
          where: { id: Number(args.eventId) },
          include: {
            Teams: {
              include: {
                TeamMembers: {
                  include: {
                    User: true,
                  },
                },
              },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        for (const team of event.Teams) {
          for (const member of team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": event.name,
            });
            await sendWhatsAppMessage(
              member.User.phoneNumber!,
              "HX154ff0082b3bd18082e22c5301927562",
              contentVariables,
            );
          }
        }
        return true;
      } catch (error) {
        console.error(
          "Error in sendEventRegistrationReminder mutation:",
          error,
        );
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    },
  }),
);

builder.mutationField("sendWinnerWhatsAppNotification", (t) =>
  t.field({
    type: "Boolean",
    args: {
      eventId: t.arg.id({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      try {
        const user = await ctx.user;
        if (!user) {
          throw new Error("Not authenticated");
        }
        if (user.role !== "ORGANIZER") {
          throw new Error("Not authorized to send WhatsApp notifications");
        }

        const event = await ctx.prisma.event.findUnique({
          where: { id: Number(args.eventId) },
          include: {
            Winner: {
              include: {
                Team: {
                  include: {
                    TeamMembers: {
                      include: {
                        User: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        for (const winner of event.Winner) {
          for (const member of winner.Team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": winner.Team.name,
              "3": winner.type,
              "4": event.name,
            });
            await sendWhatsAppMessage(
              member.User.phoneNumber!,
              "HX902d67cec04bbd3d3f9f0eb0c64a752a",
              contentVariables,
            );
          }
        }
        return true;
      } catch (error) {
        console.error(
          "Error in sendWinnerWhatsAppNotification mutation:",
          error,
        );
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    },
  }),
);
