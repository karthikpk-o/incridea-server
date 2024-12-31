import { builder } from "~/graphql/builder";
import "~/graphql/models/QuizScore/mutation";

builder.prismaObject("QuizScore", {
  fields: (t) => ({
    id: t.exposeID("id"),
    teamId: t.exposeInt("teamId"),
    quizId: t.exposeString("quizId"),
    score: t.exposeInt("score"),
  }),
});
