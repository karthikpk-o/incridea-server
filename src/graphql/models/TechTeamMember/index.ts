import { builder } from "~/graphql/builder";
import "~/graphql/models/TechTeamMember/query";

builder.prismaObject("TechTeamMember", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    role: t.exposeString("role"),
    imageUrl: t.exposeString("imageUrl", {
      nullable: true,
    }),
    github: t.exposeString("github", {
      nullable: true,
    }),
    linkedin: t.exposeString("linkedin", {
      nullable: true,
    }),
    instagram: t.exposeString("instagram", {
      nullable: true,
    }),
    quote: t.exposeString("quote"),
  }),
});
