import { builder } from "~/builder";
import "~/models/Branch/mutation";
import "~/models/Branch/query";

builder.prismaObject("Branch", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    branchReps: t.relation("BranchReps"),
    events: t.relation("Event"),
  }),
});
