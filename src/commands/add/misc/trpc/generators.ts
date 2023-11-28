import { existsSync } from "fs";
import { readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";

// 1. Create server/index.ts moved to root router position
export const rootRouterTs = () => {
  const { trpc } = getFilePaths();
  return `import { computersRouter } from "./computers";
import { router } from "${formatFilePath(trpc.serverTrpc, {
    prefix: "alias",
    removeExtension: true,
  })}";

export const appRouter = router({
  computers: computersRouter,
});

export type AppRouter = typeof appRouter;
`;
};

// 2. create server/trpc.ts
export const serverTrpcTs = () => {
  const { trpc } = getFilePaths();
  return `import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "${formatFilePath(trpc.trpcContext, {
    prefix: "alias",
    removeExtension: true,
  })}";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;`;
};

// 3. create server/router/users.ts directory and maybe a users file
export const serverRouterComputersTs = () => {
  const { hasSrc } = readConfigFile();
  const { trpc, shared } = getFilePaths();
  // check if file exists at src/lib/db/schema/computers.ts
  const schemaPath = `${hasSrc ? "src/" : ""}lib/db/schema/computers.ts`;
  const schemaExists = existsSync(schemaPath);
  return `import { publicProcedure, router } from "${formatFilePath(
    trpc.serverTrpc,
    { prefix: "alias", removeExtension: true },
  )}";${
    schemaExists
      ? `\nimport { getComputers } from "${formatFilePath(
          shared.orm.servicesDir,
          { prefix: "alias", removeExtension: false },
        )}/computers/queries"`
      : ""
  }
export const computersRouter = router({
  getComputers: publicProcedure.query(async () => {
    return ${
      schemaExists
        ? "getComputers()"
        : '[{ id: 1, name: "Macintosh" }, { id: 2, name: "Microsoft" }]'
    };
  }),
});
`;
};

// 4. create api/trpc/[trpc]/route.ts
export const apiTrpcRouteTs = () => {
  const { trpc, shared } = getFilePaths();
  return `import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { NextRequest } from "next/server";
import { appRouter } from "${formatFilePath(trpc.rootRouter, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { createTRPCContext } from "${formatFilePath(trpc.trpcContext, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { env } from "${formatFilePath(shared.init.envMjs, {
    prefix: "alias",
    removeExtension: false,
  })}";


const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              \`❌ tRPC failed on \${path ?? "<no-path>"}: \${error.message}\`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };`;
};

// 5. create lib/trpc/client.ts
export const libTrpcClientTs = () => {
  const { trpc } = getFilePaths();
  return `import { createTRPCReact } from "@trpc/react-query";

import { type AppRouter } from "${formatFilePath(trpc.rootRouter, {
    prefix: "alias",
    removeExtension: true,
  })}";

export const trpc = createTRPCReact<AppRouter>({});`;
};

// 6. create lib/trpc/Provider.tsx
export const libTrpcProviderTsx = () => {
  return `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import React, { useState } from "react";

import { trpc } from "./client";
import { getUrl } from "./utils";

import SuperJSON from "superjson";

export default function TrpcProvider({
  children,
  cookies,
}: {
  children: React.ReactNode;
  cookies: string;
}) {
  const [queryClient] = useState(() => new QueryClient({}));
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: getUrl(),
          headers() {
            return {
              cookie: cookies,
              "x-trpc-source": "react",
            };
          },
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
`;
};

// 7. create lib/trpc/serverClient.ts
export const libTrpcServerClientTs = () => {
  const { trpc } = getFilePaths();
  return `import { httpBatchLink } from "@trpc/client";

import { appRouter } from "${formatFilePath(trpc.rootRouter, {
    prefix: "alias",
    removeExtension: true,
  })}";

export const serverClient = appRouter.createCaller({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
    }),
  ],
});
`;
};

export const libTrpcApiTs = () => {
  const { packages } = readConfigFile();
  const { trpc, shared } = getFilePaths();

  return `import "server-only";

${
  packages.includes("next-auth") ? "" : "  //  "
}import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { appRouter } from "${formatFilePath(trpc.rootRouter, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { env } from "${formatFilePath(shared.init.envMjs, {
    prefix: "alias",
    removeExtension: false,
  })}";

import {
  createTRPCProxyClient,
  loggerLink,
  TRPCClientError,
} from "@trpc/client";
import { callProcedure } from "@trpc/server";
import { type TRPCErrorResponse } from "@trpc/server/rpc";
import { observable } from "@trpc/server/observable";

import { cache } from "react";
import { cookies } from "next/headers";

import SuperJSON from "superjson";

const createContext = cache(() => {
  return createTRPCContext({
    headers: new Headers({
      cookie: cookies().toString(),
      "x-trpc-source": "rsc",
    }),
  });
});

export const api = createTRPCProxyClient<typeof appRouter>({
  transformer: SuperJSON,
  links: [
    loggerLink({
      enabled: (op) =>
        env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    /**
     * Custom RSC link that lets us invoke procedures without using http requests. Since Server
     * Components always run on the server, we can just call the procedure as a function.
     */
    () =>
      ({ op }) =>
        observable((observer) => {
          createContext()
            .then((ctx) => {
              return callProcedure({
                procedures: appRouter._def.procedures,
                path: op.path,
                rawInput: op.input,
                ctx,
                type: op.type,
              });
            })
            .then((data) => {
              observer.next({ result: { data } });
              observer.complete();
            })
            .catch((cause: TRPCErrorResponse) => {
              observer.error(TRPCClientError.from(cause));
            });
        }),
  ],
});
`;
};

// 8. create lib/trpc/context.ts
export const libTrpcContextTs = (withSession: boolean = false) => {
  const { orm } = readConfigFile();
  const dbIndexPath = getDbIndexPath(orm);
  const { trpc, shared } = getFilePaths();
  return `import { db } from "${formatFilePath(dbIndexPath, {
    prefix: "alias",
    removeExtension: true,
  })}"
${withSession ? "" : " // "}import { getUserAuth } from "${formatFilePath(
    shared.auth.authUtils,
    { prefix: "alias", removeExtension: true },
  )}";

export async function createTRPCContext(opts: { headers: Headers }) {
${withSession ? "" : " // "}const { session } = await getUserAuth();

  return {
    db,
    ${withSession ? "" : "// "} session: session,
    ...opts,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
`;
};

export const libTrpcUtilsTs = () => {
  // const { orm } = readConfigFile();
  // const { shared } = getFilePaths();
  return `export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return \`https://\${process.env.VERCEL_URL}\`;
  return "http://localhost:3000";
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}`;
};

export const libTrpcApiTsBatchLink = () => {
  const { trpc } = getFilePaths();

  return `import { cookies } from "next/headers";
import { type AppRouter } from "${formatFilePath(trpc.rootRouter, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { getUrl } from "${formatFilePath(trpc.trpcUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import {
  createTRPCProxyClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client";
import SuperJSON from "superjson";

export const api = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    unstable_httpBatchStreamLink({
      url: getUrl(),
      headers() {
        return {
          cookie: cookies().toString(),
          "x-trpc-source": "rsc",
        };
      },
    }),
  ],
});

`;
};
