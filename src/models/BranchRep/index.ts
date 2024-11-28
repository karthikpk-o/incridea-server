import { builder } from "~/builder";
import "~/models/BranchRep/mutation";
import "~/models/BranchRep/query";

builder.prismaObject("BranchRep", {
  fields: (t) => ({
    userId: t.exposeID("userId"),
    branchId: t.exposeID("branchId"),
    user: t.relation("User"),
  }),
});
