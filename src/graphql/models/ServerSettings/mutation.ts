import { builder } from "~/graphql/builder";

builder.mutationField("toggleRegistrationsOpen", (t) =>
  t.prismaField({
    type: "ServerSettings",
    errors: {
      types: [Error]
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ADMIN") throw new Error("Not authorized");

      const serverSettings = await ctx.prisma.serverSettings.findFirst();
      if (!serverSettings) throw new Error("Server settings not found");

      try {
        return await ctx.prisma.serverSettings.update({
          where: {
            id: serverSettings.id,
          },
          data: {
            registrationsOpen: !serverSettings.registrationsOpen,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't toggle registrations");
      }
    },
  })
)
