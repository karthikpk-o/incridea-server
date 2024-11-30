import SchemaBuilder from "@pothos/core";
import ErrorsPlugin from "@pothos/plugin-errors";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import RelayPlugin from "@pothos/plugin-relay";
import SmartSubscriptionsPlugin, {
  subscribeOptionsFromIterator,
} from "@pothos/plugin-smart-subscriptions";
import { DateResolver, DateTimeResolver } from "graphql-scalars";

import { context } from "~/context";
import { prisma } from "~/utils/db/prisma";

export const builder = new SchemaBuilder<{
  DefaultFieldNullability: false;
  Scalars: {
    Date: { Input: Date; Output: Date };
    DateTime: { Input: Date; Output: Date };
  };
  PrismaTypes: PrismaTypes;
  Context: ReturnType<typeof context>;
}>({
  defaultFieldNullability: false,
  plugins: [ErrorsPlugin, PrismaPlugin, RelayPlugin, SmartSubscriptionsPlugin],
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
  },
  smartSubscriptions: {
    ...subscribeOptionsFromIterator((name, ctx) => {
      return ctx.pubsub.asyncIterableIterator(name);
    }),
  },
  prisma: {
    client: prisma,
  },
  errors: {
    defaultTypes: [],
  },
});

builder.addScalarType("Date", DateResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});
builder.queryType({});
builder.mutationType({});
builder.subscriptionType({});

builder.objectType(Error, {
  name: "Error",
  fields: (t) => ({
    message: t.string({
      resolve: (root) =>
        root.name === "Error" ? root.message : "Something went wrong",
    }),
  }),
});

// builder.objectType(Error, {
//   name: "Error",
//   fields: (t) => ({
//     message: t.exposeString("message"),
//   })
// })
