import { builder } from "~/graphql/builder";
import "~/graphql/models/CoreTeamMember/query";

builder.prismaObject("CoreTeamMember", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    committee: t.exposeString("committee"),
    designation: t.exposeString("designation"),
    phone: t.exposeString("phone"),
    email: t.exposeString("email"),
    imageUrl: t.exposeString("imageUrl", {
      nullable: true,
    }),
  }),
});
