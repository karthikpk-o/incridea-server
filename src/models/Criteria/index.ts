import { CriteriaType } from "@prisma/client";
import { builder } from "../../builder";
import "./mutation";

builder.enumType(CriteriaType, {
  name: "CriteriaType",
});

builder.prismaObject("Criteria", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    type: t.expose("type", {
      type: CriteriaType,
    }),
  }),
});
