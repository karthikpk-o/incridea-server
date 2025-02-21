import { UTApi } from "uploadthing/server";
import { env } from "~/env";

const utapi = new UTApi({
  token: env.UPLOADTHING_TOKEN,
});

export { utapi };
