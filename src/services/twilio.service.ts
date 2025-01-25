import Twilio from "twilio";
import { env } from "~/env";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendWhatsAppMessage = async (
  to: string,
  contentSid: string,
  contentVariables: string,
) => {
  try {
    const message = await client.messages.create({
      from: env.TWILIO_WHATSAPP_NUMBER,
      contentSid,
      contentVariables,
      to: `whatsapp:${to}`,
    });
    return message;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw new Error("Failed to send WhatsApp message");
  }
};
