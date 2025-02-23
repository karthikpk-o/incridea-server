import { builder } from "~/graphql/builder";

// builder.queryField("getQuizScores", (t) =>
//     t.field({
//         type: "QuizScore",
//         args: {
//             quizId: t.arg({
//                 type: "String",
//                 required: true,
//             })
//         },
//         errors: {
//             types: [Error],
//         },
//         resolve: async (root, args, ctx, info) => {
//             const user = await ctx.user;
//             if (!user) {
//                 throw new Error("Not authenticated");
//             }
//             if(user.role !== "ORGANIZER") {
//                 throw new Error("Not allowed to perform this action");
//             }
//             const data = await ctx.prisma.quizScore.findMany({
//                 where: {
//                     quizId: args.quizId,
//                 },
//             });
//             if (!data) {
//                 throw new Error("Quiz not found");
//             }
//             return data;
//         }
//     })
// );

builder.queryField("getQuizScores", (t) =>
  t.prismaField({
    type: ["QuizScore"],
    args: {
      quizId: t.arg.string({ required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ORGANIZER") throw new Error("Not authorized");

      const quiz = await ctx.prisma.quiz.findFirst({
        where: {
          id: args.quizId,
        },
      });

      if (!quiz) throw new Error("Quiz not found");

      const data = await ctx.prisma.quizScore.findMany({
        where: {
          quizId: args.quizId,
          Team: {
            attended: true,
            confirmed: true,
          },
          Quiz: {
            Round: {
              completed: false,
            },
          },
        },
      });

      if (data.length === 0) throw new Error("Round is completed");

      return data;
    },
  }),
);

builder.queryField("getQuizFlag", (t) =>
  t.prismaField({
    type: "QuizScore",
    args: {
      teamId: t.arg.int({ required: true }),
      quizId: t.arg.string({ required: true }),
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

      const data = await ctx.prisma.quizScore.findFirst({
        where: {
          teamId: args.teamId,
          quizId: args.quizId,
        },
      });

      if (!data) throw new Error("QuizScore not found");

      return data;
    },
  }),
);
