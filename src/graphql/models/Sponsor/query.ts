import { builder } from "~/graphql/builder";

builder.queryField("getSponsors", (t) => t.prismaField({
  type: ["Sponsor"],
  errors: {
    types: [Error],
  },
  resolve: async (query, root, args, ctx, info) => {
    try {
      return await ctx.prisma.sponsor.findMany({
        where: {
          published: true
        }
      });
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong! Couldn't fetch sponsors");
    }
  }
}))
