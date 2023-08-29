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
  enableSessionInContext,
  libAuthProviderTsx,
  libAuthUtilsTs,
  updateTrpcTs,
} from "./generators.js";
import { AuthProvider, AuthProviders } from "./utils.js";
import { checkbox } from "@inquirer/prompts";
import { addToDotEnv } from "../drizzle/generators.js";

export const addNextAuth = async () => {
  const providers = (await checkbox({
    message: "Select a provider to add",
    choices: Object.keys(AuthProviders).map((p) => {
      return { name: p, value: p };
    }),
  })) as AuthProvider[];
  const { hasSrc, preferredPackageManager, driver, packages } =
    readConfigFile();
  const rootPath = `${hasSrc ? "src" : ""}`;
  // 1. Create app/api/auth/[...nextauth].ts
  createFile(
    rootPath.concat("/app/api/auth/[...nextauth]/route.ts"),
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
  if (packages.includes("trpc")) {
    updateTrpcTs();
    enableSessionInContext();
  }

  // add to env
  addToDotEnv([
    { key: "NEXTAUTH_SECRET", value: "your_super_secret_key_here" },
    ...providers.flatMap((p) => [
      { key: p.toUpperCase().concat("_CLIENT_ID"), value: `your_${p}_id_here` },
      {
        key: p.toUpperCase().concat("_CLIENT_SECRET"),
        value: `your_${p}_secret_here`,
      },
    ]),
  ]);

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
