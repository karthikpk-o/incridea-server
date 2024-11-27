import { builder } from "../../builder";
import "./query";
import "./mutation";
import { WinnerType } from "@prisma/client";

builder.enumType(WinnerType, {
  name: "WinnerType",
});

builder.prismaObject("Winners", {
  fields: (t) => ({
    id: t.exposeID("id"),
    team: t.relation("Team"),
    event: t.relation("Event"),
    type: t.expose("type", {
      type: WinnerType,
    }),
  }),
});
