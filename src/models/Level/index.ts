import { builder } from "../../builder";
import "./mutation";
import "./query";

builder.prismaObject("Level", {
  fields: (t) => ({
    id: t.exposeID("id"),
    point: t.exposeInt("point"),
    xp: t.relation("XP"),
  }),
});
