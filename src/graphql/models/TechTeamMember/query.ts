import { builder } from "~/graphql/builder";

builder.queryField("getTechTeamMembers", (t) => t.prismaField({
  type: ["TechTeamMember"],
  errors: {
    types: [Error],
  },
  resolve: async (query, root, args, ctx, info) => {
    try {
      return await ctx.prisma.techTeamMember.findMany({
        where: {
          published: true
        },
        orderBy: {
          priority: "desc"
        },
        ...query
      });
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong! Couldn't fetch techTeamMembers");
    }
  }
}))
