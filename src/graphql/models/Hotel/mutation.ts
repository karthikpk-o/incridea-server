import { builder } from "~/graphql/builder";
import { checkIfAccommodationMember } from "~/graphql/models/UserInHotel/utils";

builder.mutationField("createHotel", (t) =>
  t.prismaField({
    type: "Hotel",
    args: {
      name: t.arg({ type: "String", required: true }),
      details: t.arg({ type: "String", required: true }),
      price: t.arg({ type: "Float", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      const isAllowed =
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        checkIfAccommodationMember(user.id) || user.role === "ADMIN";
      if (!isAllowed) throw new Error("Not allowed to perform this action");

      const hotel = await ctx.prisma.hotel.findUnique({
        where: {
          name: args.name,
        },
      });
      if (hotel) throw new Error("Hotel already exists");

      try {
        return ctx.prisma.hotel.create({
          data: {
            name: args.name,
            details: args.details,
            price: args.price,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create hotel");
      }
    },
  }),
);

builder.mutationField("deleteHotel", (t) =>
  t.prismaField({
    type: "Hotel",
    args: {
      hotelId: t.arg({ type: "String", required: true }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      const isAllowed =
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        checkIfAccommodationMember(user.id) || user.role === "ADMIN";
      if (!isAllowed) throw new Error("Not allowed to perform this action");

      const hotel = await ctx.prisma.hotel.findUnique({
        where: {
          name: args.hotelId,
        },
      });
      if (!hotel) throw new Error("Hotel does not exist");

      try {
        return await ctx.prisma.hotel.delete({
          where: {
            id: Number(args.hotelId),
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't delete hotel");
      }
    },
  }),
);

//mutation to delete Hotels
