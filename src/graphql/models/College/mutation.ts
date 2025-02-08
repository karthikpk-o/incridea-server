import { builder } from "~/graphql/builder";

builder.mutationField("createCollege", (t) =>
  t.prismaField({
    type: "College",
    args: {
      name: t.arg({
        type: "String",
        required: true,
      }),
      details: t.arg({
        type: "String",
        required: false,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (user?.role != "ADMIN") throw new Error("No Permission");

      try {
        return ctx.prisma.college.create({
          data: {
            name: args.name,
            details: args.details,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create college");
      }
    },
  }),
);

builder.mutationField("removeCollege", (t) =>
  t.field({
    type: "String",
    args: {
      id: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (root, args, ctx) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (user.role !== "ADMIN") throw new Error("No Permission");

      const college = await ctx.prisma.college.findUnique({
        where: {
          id: Number(args.id),
        },
      });
      if (!college) throw new Error(`No college with id ${args.id}`);

      try {
        await ctx.prisma.college.delete({
          where: {
            id: Number(args.id),
          },
        });
        return "College deleted successfully";
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't delete college");
      }
    },
  }),
);
