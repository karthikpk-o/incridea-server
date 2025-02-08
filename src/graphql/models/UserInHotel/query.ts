import { builder } from "~/graphql/builder";
import { checkIfAccommodationMember } from "~/graphql/models/UserInHotel/utils";

builder.queryField("accommodationRequests", (t) =>
  t.prismaField({
    type: ["UserInHotel"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (!checkIfAccommodationMember(user.id))
        throw new Error("Not authorized");

      try {
        return await ctx.prisma.userInHotel.findMany({
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);

builder.queryField("accommodationRequestsByUser", (t) =>
  t.prismaField({
    type: ["UserInHotel"],
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      try {
        return await ctx.prisma.userInHotel.findMany({
          where: {
            userId: user.id,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);

builder.queryField("accommodationRequestsByUserId", (t) =>
  t.prismaField({
    type: ["UserInHotel"],
    args: {
      userId: t.arg({ type: "ID", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (!checkIfAccommodationMember(user.id))
        throw new Error("Not authorized");
      const userId = Number(args.userId);

      try {
        return await ctx.prisma.userInHotel.findMany({
          where: {
            userId: userId,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);

builder.queryField("accommodationRequestByDay", (t) =>
  t.prismaField({
    type: ["UserInHotel"],
    args: {
      date: t.arg({ type: "DateTime", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (!checkIfAccommodationMember(user.id))
        throw new Error("Not authorized");

      try {
        return await ctx.prisma.userInHotel.findMany({
          where: {
            checkIn: {
              equals: args.date,
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);

builder.queryField("accommodationRequestByHotel", (t) =>
  t.prismaField({
    type: ["UserInHotel"],
    args: {
      name: t.arg({ type: "String", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (!checkIfAccommodationMember(user.id))
        throw new Error("Not authorized");

      const hotelName = args.name;

      try {
        return await ctx.prisma.userInHotel.findMany({
          where: {
            Hotel: {
              OR: [
                {
                  name: {
                    contains: hotelName,
                  },
                },
                {
                  details: {
                    contains: hotelName,
                  },
                },
              ],
            },
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);

builder.queryField("getUserAccommodation", (t) =>
  t.prismaField({
    type: "UserInHotel",
    nullable: true,
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (!checkIfAccommodationMember(user.id))
        throw new Error("Not authorized");

      try {
        return await ctx.prisma.userInHotel.findUnique({
          where: {
            userId: user.id,
          },
          ...query,
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't fetch accommodation requests",
        );
      }
    },
  }),
);
