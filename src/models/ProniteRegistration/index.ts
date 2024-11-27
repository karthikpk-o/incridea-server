import { ProniteDay } from "@prisma/client";
import { builder } from "../../builder";
import "./mutation";

builder.enumType(ProniteDay, {
  name: "ProniteDay",
});

builder.prismaObject("ProniteRegistration", {
  fields: (t) => ({
    userId: t.exposeID("userId"),
    proniteDay: t.expose("proniteDay", {
      type: ProniteDay,
    }),
    user: t.relation("User"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
