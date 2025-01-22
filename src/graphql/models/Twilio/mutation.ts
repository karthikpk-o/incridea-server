import { builder } from "~/graphql/builder";
import { sendWhatsAppMessage } from "~/services/twilio.service";
import { format } from "date-fns";

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

        const venue = event.venue;
        const EventName = event.name;

        for (const team of event.Teams) {
          for (const member of team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": team.name,
              "3": EventName,
              "4": venue,
            });
            const phoneNumberWithCountryCode = `+91${member.User.phoneNumber}`;
            await sendWhatsAppMessage(
              phoneNumberWithCountryCode,
              "HX3759f62a50fe9afd5ce65737b1eb0ac5",
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
        if (user.role !== "JURY") {
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

        const EventName = event.name;

        for (const winner of event.Winner) {
          for (const member of winner.Team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": winner.Team.name,
              "3": winner.type,
              "4": EventName,
            });
            const phoneNumberWithCountryCode = `+91${member.User.phoneNumber}`;
            await sendWhatsAppMessage(
              phoneNumberWithCountryCode,
              "HX581681bc4a3c9c21fb5dcf38f013b58d",
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

builder.mutationField("notifyRoundParticipants", (t) =>
  t.field({
    type: "Boolean",
    args: {
      eventId: t.arg.id({ required: true }),
      roundNo: t.arg.int({ required: true }),
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

        const round = await ctx.prisma.round.findUnique({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: args.roundNo,
            },
          },
          include: {
            Event: {
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
            },
          },
        });

        if (!round) {
          throw new Error("Round not found");
        }

        const formattedDate = round.date
          ? format(new Date(round.date), "MMMM do, yyyy h:mm a")
          : "TBD";
        const EventVenue = round.Event.venue;
        const EventName = round.Event.name;
        const RoundNo = round.roundNo.toString();

        for (const team of round.Event.Teams) {
          for (const member of team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": team.name,
              "3": RoundNo,
              "4": EventName,
              "5": formattedDate,
              "6": EventVenue,
            });
            const phoneNumberWithCountryCode = `+91${member.User.phoneNumber}`;
            await sendWhatsAppMessage(
              phoneNumberWithCountryCode,
              "HXa025709e347a0bb12ac474bb1e2173cf",
              contentVariables,
            );
          }
        }
        return true;
      } catch (error) {
        console.error("Error in notifyRoundParticipants mutation:", error);
        throw new Error(`Unexpected error: ${(error as Error).message}`);
      }
    },
  }),
);
