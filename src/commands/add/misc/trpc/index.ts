import {
  addPackageToConfig,
  createFile,
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
import { addContextProviderToLayout, addToInstallList } from "../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const addTrpc = async () => {
  const { orm } = readConfigFile();
  const { trpc } = getFilePaths();
  // 1. Create lib/server/index.ts
  createFile(
    formatFilePath(trpc.rootRouter, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    rootRouterTs()
  );

  // 2. create lib/server/trpc.ts
  createFile(
    formatFilePath(trpc.serverTrpc, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    serverTrpcTs()
  );
  // 3. create lib/server/router/ directory and maybe a users file
  // TODO : T3 COMPATABILITY
  createFile(
    formatFilePath(`lib/server/routers/computers.ts`, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    serverRouterComputersTs()
  );
  // 4. create app/api/trpc/[trpc]/route.ts
  createFile(
    formatFilePath(trpc.trpcApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    apiTrpcRouteTs()
  );
  // 5. create lib/trpc/client.ts
  createFile(
    formatFilePath(trpc.trpcClient, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libTrpcClientTs()
  );
  // 6. create lib/trpc/Provider.tsx
  createFile(
    formatFilePath(trpc.trpcProvider, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libTrpcProviderTsx()
  );
  // 7. create lib/trpc/serverClient.ts -> updated to lib/trpc/api.ts using server invoker
  // createFile(`${rootPath}/lib/trpc/serverClient.ts`, libTrpcServerClientTs());
  createFile(
    formatFilePath(trpc.trpcApiTs, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libTrpcApiTs()
    // libTrpcApiTsBatchLink(), // moved to batch link which is more stable and used by t3
  );

  // 7.5. create context file and update to include context file above
  createFile(
    formatFilePath(trpc.trpcContext, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libTrpcContextTs()
  );

  // create trpc utils file lib/trpc/utils.ts
  createFile(
    formatFilePath(trpc.trpcUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    libTrpcUtilsTs()
  );

  // 8. Install Packages: @tanstack/react-query (5.0 causing known issue, downgrading for now TODO), @trpc/client, @trpc/react-query, @trpc/server
  // await installPackages(
  //   {
  //     regular: `@tanstack/react-query@^4.32.6 @trpc/client@^10.37.1 @trpc/react-query@^10.37.1 @trpc/server@^10.37.1 @trpc/next@^10.37.1 superjson server-only${
  //       orm === null ? " zod" : ""
  //     }`,
  //     dev: "",
  //   },
  //   preferredPackageManager
  // );

  addToInstallList({
    regular: [
      "@tanstack/react-query@^4.32.6",
      "@trpc/client@^10.37.1",
      "@trpc/react-query@^10.37.1",
      "@trpc/server@^10.37.1",
      "@trpc/next@^10.37.1",
      "superjson",
      "server-only",
    ],
    dev: [],
  });
  if (orm === null) addToInstallList({ regular: ["zod"], dev: [] });

  addPackageToConfig("trpc");
  // 9. Instruct user to add the <Provider /> to their root layout.
  addContextProviderToLayout("TrpcProvider");
  // addToDotEnv(
  //   [
  //     {
  //       key: "VERCEL_URL",
  //       value: "https://your-project-url.vercel.app",
  //       // value: "",
  //       isUrl: true,
  //       customZodImplementation: "z.string().url().optional()",
  //     },
  //   ],
  //   hasSrc ? "src/" : ""
  // );

  // consola.success("Successfully added trpc to your project!");
  // consola.warn(
  //   "Please add the <Provider> to your root layout, by wrapping it around your children"
  // );
};
