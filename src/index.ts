/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { env } from "~/env";

import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { app } from "~/app";
import { yoga } from "~/graphql";

const httpServer = app.listen(env.PORT, () =>
  console.log(`🚀 Server ready at: http://localhost:4000/graphql`),
);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: yoga.graphqlEndpoint,
});

useServer(
  {
    // @ts-expect-error refer docss https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions#graphql-over-websocket-protocol-via-graphql-ws
    execute: (args) => args.rootValue.execute(args),
    // @ts-expect-error refer docss https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions#graphql-over-websocket-protocol-via-graphql-ws
    subscribe: (args) => args.rootValue.subscribe(args),
    onSubscribe: async (ctx, _id, params) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } =
        yoga.getEnveloped({
          ...ctx,
          req: ctx.extra.request,
          socket: ctx.extra.socket,
          params,
        });

      const args = {
        schema,
        operationName: params.operationName,
        document: parse(params.query),
        variableValues: params.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe,
        },
      };

      const errors = validate(args.schema, args.document);
      if (errors.length) return errors;
      return args;
    },
  },
  wsServer,
);
