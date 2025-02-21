import { builder } from "~/graphql/builder";

builder.queryField("getRegistrationsOpen", (t) =>
  t.field({
    type: "Boolean",
    errors: {
      types: [Error]
    },
    resolve: async (root, args, ctx) => {
      try {
        return (await ctx.prisma.serverSettings.findFirstOrThrow({
          select: {
            registrationsOpen: true
          }
        })).registrationsOpen;
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch server settings");
      }
    },
  })
)
