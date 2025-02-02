import { builder } from "~/graphql/builder";
import { sendWhatsAppMessage } from "~/services/twilio.service";
import { format } from "date-fns";

builder.mutationField("notifyParticipants", (t) =>
  t.field({
    type: "String",
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
                  where: {
                    roundNo: args.roundNo,
                  },
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

        if (round.notificationSent) {
          return "Notification already sent for this round";
        }

        const formattedDate = round.date
          ? format(new Date(round.date), "MMMM do, yyyy h:mm a")
          : "TBD";
        const venue = round.Event.venue;
        const templateSid =
          args.roundNo === 1
            ? "HXa91e9e7ea7c7c64def67295495c7a57c"
            : "HXa025709e347a0bb12ac474bb1e2173cf";

        for (const team of round.Event.Teams) {
          for (const member of team.TeamMembers) {
            const contentVariables = JSON.stringify({
              "1": member.User.name,
              "2": team.name,
              "3": round.roundNo.toString(),
              "4": round.Event.name,
              "5": formattedDate,
              "6": venue,
            });
            const phoneNumberWithCountryCode = `+91${member.User.phoneNumber}`;
            await sendWhatsAppMessage(
              phoneNumberWithCountryCode,
              templateSid,
              contentVariables,
            );
          }
        }

        await ctx.prisma.round.update({
          where: {
            eventId_roundNo: {
              eventId: Number(args.eventId),
              roundNo: args.roundNo,
            },
          },
          data: {
            notificationSent: true,
          },
        });

        return "Notification sent successfully";
      } catch (error) {
        console.error("Error in notifyParticipants mutation:", error);
        return "Failed to send notification. Please try again.";
      }
    },
  }),
);

builder.mutationField("sendWinnerWhatsAppNotification", (t) =>
  t.field({
    type: "String",
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

        const notificationSent = await ctx.prisma.winners.findFirst({
          where: {
            eventId: Number(args.eventId),
            notificationSent: true,
          },
        });

        if (notificationSent) {
          return "Notification already sent for this event winners";
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

          await ctx.prisma.winners.updateMany({
            where: { eventId: Number(args.eventId) },
            data: { notificationSent: true },
          });
        }

        return "Notification sent successfully";
      } catch (error) {
        console.error(
          "Error in sendWinnerWhatsAppNotification mutation:",
          error,
        );
        return "Failed to send notification. Please try again.";
      }
    },
  }),
);
