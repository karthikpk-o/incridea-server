import { YogaInitialContext } from "@graphql-yoga/node";
import { initContextCache } from "@pothos/core";

import { pubsub } from "~/pubsub";
import { authenticateUser } from "~/utils/auth/authenticateUser";
import { prisma } from "~/utils/db/prisma";

export const context = ({ request: req }: YogaInitialContext) => {
  return {
    ...initContextCache(),
    prisma,
    user: authenticateUser(prisma, req),
    req,
    pubsub: pubsub,
  };
};
