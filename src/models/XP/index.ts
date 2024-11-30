import { builder } from "~/builder";
import "~/models/XP/mutation";
import "~/models/XP/query";

builder.prismaObject("XP", {
  fields: (t) => ({
    id: t.exposeID("id"),
    user: t.relation("User"),
    level: t.relation("Level"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
