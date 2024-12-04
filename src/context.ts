import { type YogaInitialContext } from "@graphql-yoga/node";
import { prisma } from "~/utils/db/prisma";
import { initContextCache } from "@pothos/core";

import { authenticateUser } from "~/utils/auth/authenticateUser";

import { PubSub } from "graphql-subscriptions";

export const context = ({ request: req }: YogaInitialContext) => {
  return {
    ...initContextCache(),
    prisma,
    user: authenticateUser(prisma, req),
    req,
    pubsub: new PubSub(),
  };
};
