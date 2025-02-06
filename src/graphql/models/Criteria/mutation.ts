import { CriteriaType } from "@prisma/client";

import { builder } from "~/graphql/builder";

const CreateCriteriaInput = builder.inputType("CreateCriteriaInput", {
  fields: (t) => ({
    name: t.string({ required: false }),
    type: t.field({
      type: CriteriaType,
      required: false,
    }),
    roundNo: t.int({ required: true }),
    eventId: t.id({ required: true }),
  }),
});

builder.mutationField("createCriteria", (t) =>
  t.prismaField({
    type: "Criteria",
    args: {
      // FIXME(Omkar): data & CreateCriteriaInput needed?
      data: t.arg({
        type: CreateCriteriaInput,
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role != "ORGANIZER" && user.role != "JUDGE")
        throw new Error("Not Permitted");

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.data.eventId),
        },
        include: {
          Organizers: true,
          Rounds: {
            include: {
              Criteria: true,
              Judges: true,
            },
          },
        },
      });
      if (!event) throw new Error(`No Event with id ${args.data.eventId}`);

      if (
        user.role == "ORGANIZER" &&
        !event.Organizers.find((o) => o.userId === user.id)
      )
        throw new Error("Not Permitted");

      if (
        user.role == "JUDGE" &&
        !event.Rounds.find(
          (r) =>
            r.roundNo === args.data.roundNo &&
            r.Judges.find((j) => j.userId === user.id),
        )
      )
        throw new Error("Not Permitted");

      const criteriaNo =
        (event.Rounds.find((r) => r.roundNo === args.data.roundNo)?.Criteria
          .length ?? 0) + 1;

      try {
        return ctx.prisma.criteria.create({
          data: {
            eventId: Number(args.data.eventId),
            roundNo: Number(args.data.roundNo),
            name: args.data.name
              ? `${args.data.name}`
              : `Criteria ${criteriaNo}`,
            type: args.data.type ? args.data.type : CriteriaType.NUMBER,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create criteria");
      }
    },
  }),
);

builder.mutationField("deleteCriteria", (t) =>
  t.prismaField({
    type: "Criteria",
    args: {
      criteriaId: t.arg({
        type: "ID",
        required: true,
      }),
      eventId: t.arg({
        type: "ID",
        required: true,
      }),
      roundNo: t.arg({
        type: "Int",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role != "ORGANIZER" && user.role != "JUDGE")
        throw new Error("Not Permitted");

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: Number(args.eventId),
        },
        include: {
          Organizers: true,
          Rounds: {
            include: {
              Criteria: true,
              Judges: true,
            },
          },
        },
      });
      if (!event) throw new Error(`No Event with id ${args.eventId}`);

      if (
        user.role == "ORGANIZER" &&
        !event.Organizers.find((o) => o.userId === user.id)
      )
        throw new Error("Not Permitted");

      if (
        user.role == "JUDGE" &&
        !event.Rounds.find(
          (r) =>
            r.roundNo === args.roundNo &&
            r.Judges.find((j) => j.userId === user.id),
        )
      )
        throw new Error("Not Permitted");

      if (
        !event.Rounds.find((r) => r.roundNo === args.roundNo)?.Criteria.find(
          (c) => c.id === Number(args.criteriaId),
        )
      )
        throw new Error(`No Criteria with id ${args.criteriaId}!`);

      try {
        return ctx.prisma.criteria.delete({
          where: {
            id: Number(args.criteriaId),
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't delete criteria");
      }
    },
  }),
);
