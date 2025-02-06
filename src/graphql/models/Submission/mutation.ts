import { builder } from "~/graphql/builder";

builder.mutationField("createSubmission", (t) =>
  t.prismaField({
    type: "Submission",
    args: {
      image: t.arg.string({ required: true }),
      cardId: t.arg.int({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      try {
        return ctx.prisma.submission.upsert({
          where: {
            userId_cardId: {
              userId: user.id,
              cardId: args.cardId,
            },
          },

          create: {
            userId: user.id,
            cardId: args.cardId,
            image: args.image,
          },
          update: {
            image: args.image,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Failed to create submission");
      }
    },
  }),
);
