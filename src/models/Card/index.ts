import { DayType } from "@prisma/client";
import { builder } from "../../builder";
import "./mutation";
import "./query";

builder.enumType(DayType, {
  name: "DayType",
});

builder.prismaObject("Card", {
  fields: (t) => ({
    id: t.exposeID("id"),
    clue: t.exposeString("clue"),
    day: t.expose("day", {
      type: DayType,
    }),
    submissions: t.relation("Submissions"),
  }),
});
