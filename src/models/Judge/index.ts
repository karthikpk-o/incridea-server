import { builder } from "../../builder";
import "./mutation";
import "./query";

builder.prismaObject("Judge", {
  fields: (t) => ({
    user: t.relation("User"),
    round: t.relation("Round"),
  }),
});
