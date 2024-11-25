import { builder } from "../../builder";
import "./mutation";
import "./query";

builder.prismaObject("Winners", {
  fields: (t) => ({
    id: t.exposeID("id"),
    team: t.relation("Team"),
    event: t.relation("Event"),
    type: t.exposeString("type"),
  }),
});
