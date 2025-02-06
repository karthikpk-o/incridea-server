import { builder } from "~/graphql/builder";

builder.queryField("getAllHotels", (t) =>
  t.prismaField({
    type: ["Hotel"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        return await ctx.prisma.hotel.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch hotels");
      }
    },
  }),
);
