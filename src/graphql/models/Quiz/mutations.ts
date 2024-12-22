import { builder } from "~/graphql/builder";

const OptionsType = builder.inputType("OptionsCreateInput", {
  fields: (t) => ({
    value: t.string({ required: true }),
    isAnswer: t.boolean({ required: true }),
  }),
});

const QuestionsType = builder.inputType("QuestionsCreateInput", {
  fields: (t) => ({
    question: t.string({ required: true }),
    description: t.string({ required: false }),
    isCode: t.boolean({ required: false }),
    options: t.field({ type: [OptionsType], required: false }),
    points: t.int({ required: false }),
    negativePoints: t.int({ required: false }),
    image: t.string({ required: false }),
  }),
});

builder.mutationField("createQuiz", (t) =>
  t.prismaField({
    type: "Quiz",
    args: {
      name: t.arg({ type: "String", required: true }),
      description: t.arg({ type: "String" }), //check
      roundId: t.arg({ type: "String", required: true }),
      eventId: t.arg({ type: "String", required: true }),
      startTime: t.arg({ type: "String", required: true }),
      endTime: t.arg({ type: "String", required: true }),
      questions: t.arg({ type: [QuestionsType], required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (user.role !== "ORGANIZER")
        throw new Error("Not allowed to perform this action");

      const round = await ctx.prisma.round.findUnique({
        where: {
          eventId_roundNo: {
            eventId: Number(args.eventId),
            roundNo: Number(args.roundId),
          },
        },
      });

      if (!round) {
        throw new Error("Round not found");
      }

      const data = await ctx.prisma.quiz.upsert({
        where: {
          eventId_roundId: {
            eventId: Number(args.eventId),
            roundId: Number(args.roundId),
          },
        },
        create: {
          name: args.name,
          description: args.description,
          startTime: new Date(args.startTime),
          endTime: new Date(args.endTime),
          Round: {
            connect: {
              eventId_roundNo: {
                eventId: Number(args.eventId),
                roundNo: Number(args.roundId),
              },
            },
          },
        },
        update: {
          name: args.name,
          description: args.description,
          startTime: new Date(args.startTime),
          endTime: new Date(args.endTime),
        },
        ...query,
      });

      await ctx.prisma.round.update({
        where: {
          eventId_roundNo: {
            eventId: Number(args.eventId),
            roundNo: Number(args.roundId),
          },
        },
        data: {
          quizId: data.id ?? "",
        },
      });

      await ctx.prisma.question.deleteMany({
        where: {
          quizId: data.id,
        },
      });

      await ctx.prisma.quiz.update({
        where: {
          id: data.id,
        },
        data: {
          Questions: {
            create: args.questions.map((q) => ({
              question: q.question,
              description: q.description,
              isCode: q.isCode ?? false,
              points: q.points ?? 20,
              negativePoints: q.negativePoints ?? 0,
              image: q.image,
              options: {
                create: q.options?.map((option) => ({
                  value: option.value,
                  isAnswer: option.isAnswer,
                })),
              },
            })),
          },
        },
      });

      return data;
    },
  }),
);

builder.mutationField("updateQuizStatus", (t) =>
  t.prismaField({
    type: "Quiz",
    args: {
      quizId: t.arg({ type: "String", required: true }),
      allowAttempts: t.arg({ type: "Boolean", required: true }),
      password: t.arg({ type: "String", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      //Get user from context
      // const user = await ctx.user;
      // if (!user) {
      //   throw new Error("Not authenticated");
      // }

      // if (user.role !== "ORGANIZER")
      //   throw new Error("Not allowed to perform this action");

      //create accommodation request
      const data = await ctx.prisma.quiz.update({
        where: {
          id: args.quizId,
        },
        data: {
          allowAttempts: args.allowAttempts,
          password: args.password,
        },
        ...query,
      });
      return data;
    },
  }),
);
