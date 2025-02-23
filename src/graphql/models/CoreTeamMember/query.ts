import { builder } from "~/graphql/builder";

builder.queryField("getCoreTeamMembers", (t) => t.prismaField({
  type: ["CoreTeamMember"],
  errors: {
    types: [Error],
  },
  resolve: async (query, root, args, ctx, info) => {
    try {
      return await ctx.prisma.coreTeamMember.findMany({
        where: {
          published: true
        },
        orderBy: [
          {
            committee: 'asc',
          },
          {
            designation: 'asc',
          }
        ],
        ...query
      });
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong! Couldn't fetch coreTeamMembers");
    }
  }
}))
