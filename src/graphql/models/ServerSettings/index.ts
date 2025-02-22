import { builder } from "~/graphql/builder";
import "~/graphql/models/ServerSettings/mutation";
import "~/graphql/models/ServerSettings/query";

builder.prismaObject("ServerSettings", {
  fields: (t) => ({
    registrationsOpen: t.exposeBoolean("registrationsOpen"),
  })
})
