import { builder } from "../../builder";
import "./mutation";
import "./query";

builder.prismaObject("BranchRep", {
  fields: (t) => ({
    userId: t.exposeID("userId"),
    branchId: t.exposeID("branchId"),
    user: t.relation("User"),
  }),
});
