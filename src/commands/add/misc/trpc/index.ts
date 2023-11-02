import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
} from "../../../../utils.js";
import {
  apiTrpcRouteTs,
  libTrpcApiTs,
  libTrpcClientTs,
  libTrpcContextTs,
  libTrpcProviderTsx,
  libTrpcUtilsTs,
  rootRouterTs,
  serverRouterComputersTs,
  serverTrpcTs,
} from "./generators.js";
import { addContextProviderToLayout } from "../../utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";

export const addTrpc = async () => {
  const { hasSrc, preferredPackageManager, packages } = readConfigFile();
  const rootPath = `${hasSrc ? "src/" : ""}`;
  // 1. Create lib/server/index.ts
  createFile(`${rootPath}lib/server/routers/_app.ts`, rootRouterTs());

  // 2. create lib/server/trpc.ts
  createFile(`${rootPath}lib/server/trpc.ts`, serverTrpcTs());
  // 3. create lib/server/router/ directory and maybe a users file
  createFile(
    `${rootPath}lib/server/routers/computers.ts`,
    serverRouterComputersTs()
  );
  // 4. create app/api/trpc/[trpc]/route.ts
  createFile(`${rootPath}app/api/trpc/[trpc]/route.ts`, apiTrpcRouteTs());
  // 5. create lib/trpc/client.ts
  createFile(`${rootPath}lib/trpc/client.ts`, libTrpcClientTs());
  // 6. create lib/trpc/Provider.tsx
  createFile(`${rootPath}lib/trpc/Provider.tsx`, libTrpcProviderTsx());
  // 7. create lib/trpc/serverClient.ts -> updated to lib/trpc/api.ts using server invoker
  // createFile(`${rootPath}/lib/trpc/serverClient.ts`, libTrpcServerClientTs());
  createFile(`${rootPath}lib/trpc/api.ts`, libTrpcApiTs());

  // 7.5. create context file and update to include context file above
  createFile(
    `${rootPath}lib/trpc/context.ts`,
    libTrpcContextTs(packages.includes("next-auth"))
  );

  // create trpc utils file lib/trpc/utils.ts
  createFile(`${rootPath}lib/trpc/utils.ts`, libTrpcUtilsTs());

  // 8. Install Packages: @tanstack/react-query (5.0 causing known issue, downgrading for now TODO), @trpc/client, @trpc/react-query, @trpc/server
  await installPackages(
    {
      regular: `@tanstack/react-query@4.32.1 @trpc/client @trpc/react-query @trpc/server @trpc/next superjson${
        !packages.includes("drizzle") ? " zod" : ""
      }`,
      dev: "",
    },
    preferredPackageManager
  );
  addPackageToConfig("trpc");
  // 9. Instruct user to add the <Provider /> to their root layout.
  addContextProviderToLayout("TrpcProvider");
  addToDotEnv(
    [
      {
        key: "VERCEL_URL",
        value: "https://your-project-url.vercel.app",
        // value: "",
        isUrl: true,
        customZodImplementation: "z.string().url().optional()",
      },
    ],
    hasSrc ? "src/" : ""
  );
  consola.success("Successfully added trpc to your project!");
  // consola.warn(
  //   "Please add the <Provider> to your root layout, by wrapping it around your children"
  // );
};
