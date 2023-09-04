import { existsSync } from "fs";
import { readConfigFile } from "../../../utils.js";

// 1. Create server/index.ts moved to root router position
export const rootRouterTs = () => {
  return `import { computersRouter } from "./computers";
import { router } from "../trpc";

export const appRouter = router({
  computers: computersRouter,
});

export type AppRouter = typeof appRouter;
`;
};

// 2. create server/trpc.ts
export const serverTrpcTs = () => {
  return `import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "../trpc/context";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
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
  // check if file exists at src/lib/db/schema/computers.ts
  const schemaPath = `${hasSrc ? "src/" : ""}lib/db/schema/computers.ts`;
  const schemaExists = existsSync(schemaPath);
  return `import { publicProcedure, router } from "../trpc";${
    schemaExists
      ? '\nimport { getComputers } from "@/lib/api/computers/queries"'
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
  return `import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/lib/server/routers/_app";
import { createContext } from "@/lib/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };`;
};

// 5. create lib/trpc/client.ts
export const libTrpcClientTs = () => {
  return `import { createTRPCReact } from "@trpc/react-query";

import { type AppRouter } from "@/lib/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>({});`;
};

// 6. create lib/trpc/Provider.tsx
export const libTrpcProviderTsx = () => {
  return `"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";

import { trpc } from "./client";
import { getUrl } from "./utils";
import SuperJSON from "superjson";

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({}));
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}`;
};

// 7. create lib/trpc/serverClient.ts
export const libTrpcServerClientTs = () => {
  return `import { httpBatchLink } from "@trpc/client";

import { appRouter } from "@/lib/server/routers/_app";

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

  return `import { cookies } from "next/headers";
${
  packages.includes("next-auth") ? "" : "  //  "
}import { getUserAuth } from "../auth/utils";
import { appRouter } from "../server/routers/_app";
import { loggerLink } from "@trpc/client";
import { experimental_createTRPCNextAppDirServer as createTRPCNextAppDirServer } from "@trpc/next/app-dir/server";
import { experimental_nextCacheLink as nextCacheLink } from "@trpc/next/app-dir/links/nextCache";
import SuperJSON from "superjson";

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const api = createTRPCNextAppDirServer<typeof appRouter>({
  config() {
    return {
      transformer: SuperJSON,
      links: [
        loggerLink({
          enabled: (op) => true,
        }),
        nextCacheLink({
          revalidate: 5,
          router: appRouter,
          async createContext() {
            ${
              packages.includes("next-auth") ? "" : "  //  "
            }const { session } = await getUserAuth();
            return {
              ${packages.includes("next-auth") ? "" : "  //  "}session,
              headers: {
                cookie: cookies().toString(),
                "x-trpc-source": "rsc-invoke",
              },
            };
          },
        }),
      ],
    };
  },
});
`;
};

// 8. create lib/trpc/context.ts
export const libTrpcContextTs = (withSession: boolean = false) => {
  return `import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
${withSession ? "" : " // "}import { getUserAuth } from "../auth/utils";

export async function createContext(opts?: FetchCreateContextFnOptions) {
${withSession ? "" : " // "}const { session } = await getUserAuth();

  return {
    ${withSession ? "" : "// "} session: session,
    headers: opts && Object.fromEntries(opts.req.headers),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
`;
};

export const libTrpcUtilsTs = () => {
  return `function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return \`https://${process.env.VERCEL_URL}\`;
  return "http://localhost:3000";
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}`;
};
