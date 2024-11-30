import { CollegeType } from "@prisma/client";

import { builder } from "~/builder";
import "~/models/College/mutation";
import "~/models/College/query";

builder.enumType(CollegeType, {
  name: "CollegeType",
});

builder.prismaObject("College", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
  }),
});
