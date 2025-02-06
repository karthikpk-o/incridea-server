import { createYoga } from "graphql-yoga";
import { yogaContext } from "~/graphql/context";
import { pothosSchema } from "~/graphql/schema";
import { yogaPlugins } from "~/graphql/plugins";
import { env } from "~/env";

const yoga = createYoga({
  context: yogaContext,
  schema: pothosSchema,
  plugins: yogaPlugins,
  graphiql: {
    subscriptionsProtocol: "WS",
  },
  logging: env.NODE_ENV === "development" ? "debug" : "info",
});

export { yoga };
