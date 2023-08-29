import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
} from "../../../utils.js";
import {
  apiAuthNextAuthTs,
  createAuthSchema,
  createSignInComponent,
  libAuthProviderTsx,
  libAuthUtilsTs,
  updateTrpcTs,
} from "./generators.js";
import { AuthProvider, AuthProviders } from "./utils.js";
import { checkbox } from "@inquirer/prompts";

export const addNextAuth = async () => {
  const providers = (await checkbox({
    message: "Select a provider to add",
    choices: Object.keys(AuthProviders).map((p) => {
      return { name: p, value: p };
    }),
  })) as AuthProvider[];
  const { hasSrc, preferredPackageManager, driver } = readConfigFile();
  const rootPath = `${hasSrc ? "src" : ""}`;
  // 1. Create app/api/auth/[...nextauth].ts
  createFile(
    rootPath.concat("/app/api/auth/[...nextauth].ts"),
    apiAuthNextAuthTs(providers)
  );

  // 2. create lib/auth/Provider.tsx
  createFile(rootPath.concat("/lib/auth/Provider.tsx"), libAuthProviderTsx());

  // 3. create lib/auth/utils.ts
  createFile(rootPath.concat("/lib/auth/utils.ts"), libAuthUtilsTs());

  // 4. create lib/db/schema/auth.ts
  createFile(
    rootPath.concat("/lib/db/schema/auth.ts"),
    createAuthSchema(driver)
  );

  // 5. create components/auth/SignIn.tsx
  createFile(
    rootPath.concat("/components/auth/SignIn.tsx"),
    createSignInComponent()
  );

  // 6. If trpc installed, add protectedProcedure
  updateTrpcTs();

  // 7. Install Packages: @auth/core @auth/drizzle-adapter next-auth
  await installPackages(
    {
      regular: "@auth/core @auth/drizzle-adapter next-auth",
      dev: "",
    },
    preferredPackageManager
  );
  addPackageToConfig("next-auth");
  // 9. Instruct user to add the <Provider /> to their root layout.
  consola.success("Successfully added Next Auth to your project!");
  consola.warn(
    "Please add the <NextAuthProvider> to your root layout, by wrapping it around your children"
  );
};
