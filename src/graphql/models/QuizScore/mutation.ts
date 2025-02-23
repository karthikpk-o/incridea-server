import { builder } from "~/graphql/builder";
import { prisma } from "~/utils/db";

const OptionsType = builder.inputType("SelectedOptions", {
  fields: (t) => ({
    id: t.string({ required: true }),
    value: t.string({ required: true }),
    questionId: t.string({ required: true }),
  }),
});

builder.mutationField("submitQuiz", (t) =>
  t.prismaField({
    type: "QuizScore",
    args: {
      teamId: t.arg.int({ required: true }),
      quizId: t.arg.string({ required: true }),
      selectedAnswers: t.arg({ type: [OptionsType], required: true }),
      timeTaken: t.arg.float({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      const quiz = await ctx.prisma.quiz.findFirst({
        where: {
          id: args.quizId,
        },
      });
      if (!quiz) throw new Error("Quiz not found");

      let points = 0;

      for (const answer of args.selectedAnswers) {
        await ctx.prisma.quizSubmission.create({
          data: {
            teamId: args.teamId,
            optionId: answer.id,
          },
        });
        const ans = await ctx.prisma.options.findFirst({
          where: {
            id: answer.id,
          },
        });
        if (ans?.isAnswer) points += quiz.points;
      }

      return await ctx.prisma.quizScore.upsert({
        where: {
          teamId_quizId: {
            teamId: args.teamId,
            quizId: args.quizId,
          },
        },
        update: {
          score: points,
          timeTaken: args.timeTaken,
        },
        create: {
          quizId: args.quizId,
          teamId: args.teamId,
          score: points,
          timeTaken: args.timeTaken,
        },
      });
    },
  }),
);

builder.mutationField("updateQuizFlag", (t) =>
  t.prismaField({
    type: "QuizScore",
    args: {
      teamId: t.arg.int({ required: true }),
      quizId: t.arg.string({ required: true }),
      flags: t.arg.int({ required: true }),
      allowUser: t.arg.boolean({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      const quiz = await ctx.prisma.quiz.findFirst({
        where: {
          id: args.quizId,
        },
      });

      if (!quiz) throw new Error("Quiz not found");

      return await ctx.prisma.quizScore.update({
        where: {
          teamId_quizId: {
            teamId: args.teamId,
            quizId: args.quizId,
          },
        },
        data: {
          flags: args.flags,
          allowUser: args.allowUser,
        },
      });
    },
  }),
);

builder.mutationField("promoteQuizParticipants", (t) =>
  t.prismaField({
    type: "Quiz",
    args: {
      teams: t.arg({ type: ["Int"], required: true }),
      quizId: t.arg.string({ required: true }),
      eventId: t.arg.int({ required: true }),
      roundId: t.arg.int({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER")
        throw new Error("Not allowed to perform this action");

      await prisma.$transaction(async (db) => {
        for (const teamId of args.teams) {
          await db.team.update({
            where: {
              id: teamId,
            },
            data: {
              roundNo: {
                increment: 1,
              },
            },
          });
        }
        await db.round.update({
          where: {
            eventId_roundNo: {
              eventId: args.eventId,
              roundNo: args.roundId,
            },
          },
          data: {
            completed: true,
          },
        });
      });

      const quiz = await ctx.prisma.quiz.findFirst({
        where: {
          id: args.quizId,
        },
      });

      if (!quiz) throw new Error("Quiz not found");

      return quiz;
    },
  }),
);
