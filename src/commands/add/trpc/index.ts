import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
} from "../../../utils.js";
import {
  apiTrpcRouteTs,
  libTrpcClientTs,
  libTrpcProviderTsx,
  libTrpcServerClientTs,
  rootRouterTs,
  serverRouterUsersTs,
  serverTrpcTs,
} from "./generators.js";

export const addTrpc = async () => {
  const { hasSrc, preferredPackageManager } = readConfigFile();
  const rootPath = `${hasSrc ? "src" : ""}`;
  // 1. Create lib/server/index.ts
  createFile(`${rootPath}/lib/server/routers/_app.ts`, rootRouterTs());

  // 2. create lib/server/trpc.ts
  createFile(`${rootPath}/lib/server/trpc.ts`, serverTrpcTs());
  // 3. create lib/server/router/ directory and maybe a users file
  createFile(`${rootPath}/lib/server/routers/users.ts`, serverRouterUsersTs());
  // 4. create app/api/trpc/[trpc]/route.ts
  createFile(`${rootPath}/app/api/trpc/[trpc]/route.ts`, apiTrpcRouteTs());
  // 5. create lib/trpc/client.ts
  createFile(`${rootPath}/lib/trpc/client.ts`, libTrpcClientTs());
  // 6. create lib/trpc/Provider.tsx
  createFile(`${rootPath}/lib/trpc/Provider.tsx`, libTrpcProviderTsx());
  // 7. create lib/trpc/serverClient.ts
  createFile(`${rootPath}/lib/trpc/serverClient.ts`, libTrpcServerClientTs());

  // 7.5. create context file and update to include context file above

  // 8. Install Packages: @tanstack/react-query, @trpc/client, @trpc/react-query, @trpc/server
  installPackages(
    {
      regular:
        "@tanstack/react-query @trpc/client @trpc/react-query @trpc/server",
      dev: "",
    },
    preferredPackageManager
  );
  addPackageToConfig("trpc");
  // 9. Instruct user to add the <Provider /> to their root layout.
  consola.success("Successfully added trpc to your project!");
  consola.info(
    "Please add the <Provider> to your root layout, by wrapping it around your children"
  );
};
