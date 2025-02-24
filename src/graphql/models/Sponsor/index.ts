import { builder } from "~/graphql/builder";
import "~/graphql/models/Sponsor/query";

builder.prismaObject("Sponsor", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    websiteUrl: t.exposeString("websiteUrl", {
      nullable: true,
    }),
    imageUrl: t.exposeString("imageUrl", {
      nullable: true,
    }),
  }),
});
