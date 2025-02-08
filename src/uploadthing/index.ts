import { createRouteHandler } from "uploadthing/express";
import { UTApi } from "uploadthing/server";
import { env } from "~/env";
import { uploadRouter } from "~/uploadthing/router";

const uploadThingHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: env.UPLOADTHING_TOKEN,
  },
});

export const utapi = new UTApi({
  token: env.UPLOADTHING_TOKEN,
});

export { uploadThingHandler };
