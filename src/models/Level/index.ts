import { builder } from "~/builder";
import "~/models/Level/mutation";
import "~/models/Level/query";

builder.prismaObject("Level", {
  fields: (t) => ({
    id: t.exposeID("id"),
    point: t.exposeInt("point"),
    xp: t.relation("XP"),
  }),
});
