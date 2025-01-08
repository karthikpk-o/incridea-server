import { builder } from "~/graphql/builder";
import { sendWhatsAppMessage } from "~/services/twilio.service";

builder.mutationField("sendWhatsAppNotification", (t) =>
  t.field({
    type: "Boolean",
    args: {
      recipientId: t.arg.id({ required: true }),
      contentSid: t.arg.string({ required: true }),
      contentVariables: t.arg.string({ required: true }),
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

        const recipient = await ctx.prisma.user.findUnique({
          where: { id: Number(args.recipientId) },
        });
        if (!recipient) {
          throw new Error("Recipient not found");
        }

        await sendWhatsAppMessage(
          recipient.phoneNumber,
          args.contentSid,
          args.contentVariables,
        );
        return true;
      } catch (error) {
        console.error("Error in sendWhatsAppNotification mutation:", error);
        throw new Error("Unexpected error.");
      }
    },
  }),
);

builder.mutationField("sendWinnerWhatsAppNotification", (t) =>
  t.field({
    type: "Boolean",
    args: {
      eventId: t.arg.id({ required: true }),
      contentSid: t.arg.string({ required: true }),
      contentVariables: t.arg.string({ required: true }),
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

        const winners = await ctx.prisma.winners.findMany({
          where: { eventId: Number(args.eventId) },
          include: {
            Team: { include: { TeamMembers: { include: { User: true } } } },
          },
        });

        for (const winner of winners) {
          for (const member of winner.Team.TeamMembers) {
            await sendWhatsAppMessage(
              member.User.phoneNumber,
              args.contentSid,
              args.contentVariables,
            );
          }
        }
        return true;
      } catch (error) {
        console.error(
          "Error in sendWinnerWhatsAppNotification mutation:",
          error,
        );
        throw new Error(`Unexpected error: ${error.message}`);
      }
    },
  }),
);
