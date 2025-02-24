import { builder } from "~/graphql/builder";
import { sendWhatsAppMessage } from "~/services/twilio.service";
import { format } from "date-fns";
import {
  INDIVIDUAL_INITIAL_TEMPLATE_SID,
  TEAM_INITIAL_TEMPLATE_SID,
  INDIVIDUAL_ROUND_TEMPLATE_SID,
  TEAM_ROUND_TEMPLATE_SID,
  INDIVIDUAL_WINNER_TEMPLATE_SID,
  TEAM_WINNER_TEMPLATE_SID,
} from "~/constants/templateIDs";
import { AUTHORIZED_PIDS } from "~/constants/juryIDs";

builder.mutationField("notifyParticipants", (t) =>
  t.field({
    type: "String",
    errors: {
      types: [Error],
    },
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
          round.Event.eventType === "INDIVIDUAL"
            ? args.roundNo === 1
              ? INDIVIDUAL_INITIAL_TEMPLATE_SID
              : INDIVIDUAL_ROUND_TEMPLATE_SID
            : args.roundNo === 1
              ? TEAM_INITIAL_TEMPLATE_SID
              : TEAM_ROUND_TEMPLATE_SID;

        for (const team of round.Event.Teams) {
          for (const member of team.TeamMembers) {
            const contentVariables =
              round.Event.eventType === "INDIVIDUAL"
                ? JSON.stringify({
                    participant_name: member.User.name,
                    round_number: round.roundNo.toString(),
                    event_name: round.Event.name,
                    event_date: formattedDate,
                    event_location: venue,
                  })
                : JSON.stringify({
                    participant_name: member.User.name,
                    team_name: team.name,
                    round_number: round.roundNo.toString(),
                    event_name: round.Event.name,
                    event_date: formattedDate,
                    event_location: venue,
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
        throw error;
      }
    },
  }),
);

builder.mutationField("sendWinnerWhatsAppNotification", (t) =>
  t.field({
    type: "String",
    errors: {
      types: [Error],
    },
    args: {
      eventId: t.arg.id({ required: true }),
      location: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }),
      fromTime: t.arg.string({ required: true }),
      toTime: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      try {
        const user = await ctx.user;
        if (!user) {
          throw new Error("Not authenticated");
        }
        if (user.role !== "JURY" || !AUTHORIZED_PIDS.includes(user.id)) {
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
        const templateSid =
          event.eventType === "INDIVIDUAL"
            ? INDIVIDUAL_WINNER_TEMPLATE_SID
            : TEAM_WINNER_TEMPLATE_SID;

        for (const winner of event.Winner) {
          for (const member of winner.Team.TeamMembers) {
            const contentVariables =
              event.eventType === "INDIVIDUAL"
                ? JSON.stringify({
                    participant_name: member.User.name,
                    winner_type: winner.type,
                    event_name: EventName,
                    event_location: args.location,
                    event_date: args.date,
                    start_time: args.fromTime,
                    end_time: args.toTime,
                  })
                : JSON.stringify({
                    participant_name: member.User.name,
                    team_name: winner.Team.name,
                    winner_type: winner.type,
                    event_name: EventName,
                    event_location: args.location,
                    event_date: args.date,
                    start_time: args.fromTime,
                    end_time: args.toTime,
                  });
            const phoneNumberWithCountryCode = `+91${member.User.phoneNumber}`;
            await sendWhatsAppMessage(
              phoneNumberWithCountryCode,
              templateSid,
              contentVariables,
            );
          }
        }

        await ctx.prisma.winners.updateMany({
          where: { eventId: Number(args.eventId) },
          data: { notificationSent: true },
        });

        return "Notification sent successfully";
      } catch (error) {
        throw error;
      }
    },
  }),
);
