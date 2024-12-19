import { type QuestionType } from "@prisma/client";

import { builder } from "~/graphql/builder";

const OptionsType = builder.inputType("OptionsCreateInput", {
  fields: (t) => ({
    value: t.string({ required: true }),
    isAnswer: t.boolean({ required: true }),
  }),
});

builder.mutationField("createQuestion", (t) =>
  t.prismaField({
    type: "Question",
    args: {
      quizId: t.arg({ type: "String", required: true }),
      question: t.arg({ type: "String", required: true }),
      points: t.arg({ type: "Int", required: true }),
      negativePoint: t.arg({ type: "Int", required: false }),
      type: t.arg({ type: "String", required: false }),
      image: t.arg({ type: "String", required: false }),
      options: t.arg({ type: [OptionsType], required: false }),
      description: t.arg({ type: "String", required: false }),
      isCode: t.arg({ type: "Boolean", required: false }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      //Get user from context
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (user.role !== "ORGANIZER")
        throw new Error("Not allowed to perform this action");

      //create accommodation request
      // let temp = [{ id: "" }];
      // if (args.options) {
      //   temp = args.options?.split(",").map((option) => ({
      //     id: option,
      //   }));
      // }
      const data = await ctx.prisma.question.create({
        data: {
          question: args.question,
          Quiz: {
            connect: {
              id: args.quizId,
            },
          },
          points: args.points,
          image: args.image,
          negativePoints: args.negativePoint ?? 0,
          options: {
            create: args.options?.map((option) => ({
              value: option.value,
              isAnswer: option.isAnswer,
            })),
          },
          questionType: args.type as QuestionType,
          description: args.description,
          isCode: args.isCode ?? false,
        },
        ...query,
      });
      return data;
    },
  }),
);
