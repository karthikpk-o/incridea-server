import { builder } from "~/builder";
import "~/models/Organizer/mutation";
import "~/models/Organizer/query";

builder.prismaObject("Organizer", {
  fields: (t) => ({
    eventId: t.exposeID("eventId"),
    user: t.relation("User"),
  }),
});
