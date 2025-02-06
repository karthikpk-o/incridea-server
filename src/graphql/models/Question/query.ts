import { builder } from "~/graphql/builder";

builder.queryField("getAllquestions", (t) =>
  t.prismaField({
    type: ["Question"],
    args: {
      quizId: t.arg({
        type: "String",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      try {
        const user = await ctx.user;
        if (!user) throw new Error("Not authenticated");

        return await ctx.prisma.question.findMany({
          where: {
            quizId: args.quizId,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't fetch questions");
      }
    },
  }),
);
