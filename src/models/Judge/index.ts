import { builder } from "~/builder";
import "~/models/Judge/mutation";
import "~/models/Judge/query";

builder.prismaObject("Judge", {
  fields: (t) => ({
    user: t.relation("User"),
    round: t.relation("Round"),
  }),
});
