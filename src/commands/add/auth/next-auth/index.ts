import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import {
  apiAuthNextAuthTs,
  createDrizzleAuthSchema,
  createPrismaAuthSchema,
  createSignInComponent,
  enableSessionInContext,
  enableSessionInTRPCApi,
  generateUpdatedRootRoute,
  libAuthProviderTsx,
  libAuthUtilsTs,
  updateTrpcTs,
} from "./generators.js";
import { AuthDriver, AuthProvider, AuthProviders } from "./utils.js";
import { checkbox } from "@inquirer/prompts";
import { addContextProviderToLayout } from "../../utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addToPrismaSchema } from "../../../generate/utils.js";
import { prismaGenerate } from "../../orm/utils.js";
import { InitOptions } from "../../../../types.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { updateRootSchema } from "../../../generate/generators/model/utils.js";

export const addNextAuth = async (options?: InitOptions) => {
  const providers =
    options?.authProviders ||
    ((await checkbox({
      message: "Select a provider to add",
      choices: Object.keys(AuthProviders).map((p) => {
        return { name: p, value: p };
      }),
    })) as AuthProvider[]);

  const {
    hasSrc,
    preferredPackageManager,
    driver,
    packages,
    orm,
    componentLib,
    provider: dbProvider,
    t3,
  } = readConfigFile();
  const rootPath = `${hasSrc ? "src/" : ""}`;
  const { "next-auth": nextAuth, shared } = getFilePaths();

  // 1. Create app/api/auth/[...nextauth].ts
  createFile(
    formatFilePath(nextAuth.nextAuthApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiAuthNextAuthTs()
  );

  // 2. create lib/auth/Provider.tsx
  createFile(
    formatFilePath(nextAuth.authProviderComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    libAuthProviderTsx()
  );

  // 3. create lib/auth/utils.ts
  createFile(
    formatFilePath(shared.auth.authUtils, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    libAuthUtilsTs(providers, driver, orm)
  );

  // 4. create lib/db/schema/auth.ts
  if (orm !== null) {
    if (orm === "drizzle") {
      createFile(
        formatFilePath(shared.auth.authSchema, {
          removeExtension: false,
          prefix: "rootPath",
        }),
        createDrizzleAuthSchema(driver)
      );
      if (t3) {
        updateRootSchema("auth", true, "next-auth");
      }
    }
    if (orm === "prisma") {
      addToPrismaSchema(
        createPrismaAuthSchema(driver, dbProvider === "planetscale"),
        "Auth"
      );
    }
  }

  // 5. create components/auth/SignIn.tsx - TODO - may be causing problems
  createFile(
    formatFilePath(shared.auth.signInComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    createSignInComponent(componentLib)
  );

  // 6. If trpc installed, add protectedProcedure
  if (packages.includes("trpc")) {
    if (!t3) {
      updateTrpcTs();
      enableSessionInContext();
      enableSessionInTRPCApi();
    }
  }

  replaceFile(rootPath.concat("app/page.tsx"), generateUpdatedRootRoute());

  // add to env
  addToDotEnv(
    [
      {
        key: "NEXTAUTH_SECRET",
        value: "your_super_secret_key_here",
        customZodImplementation: `process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional()`,
      },
      {
        key: "NEXTAUTH_URL",
        value: "http://localhost:3000",
        customZodImplementation: `z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include \`https\` so it cant be validated as a URL
      process.env.VERCEL_URL ? z.string().min(1) : z.string().url()
    )`,
      },
      ...providers.flatMap((p) => [
        {
          key: p.toUpperCase().concat("_CLIENT_ID"),
          value: `your_${p}_id_here`,
          // value: "",
        },
        {
          key: p.toUpperCase().concat("_CLIENT_SECRET"),
          value: `your_${p}_secret_here`,
          // value: "",
        },
      ]),
    ],
    hasSrc ? "src/" : ""
  );

  // 7. Install Packages: @auth/core @auth/drizzle-adapter next-auth
  await installPackages(
    {
      regular: `@auth/core next-auth${
        orm !== null ? ` ${AuthDriver[orm].package}` : ""
      }`,
      dev: "",
    },
    preferredPackageManager
  );
  addPackageToConfig("next-auth");
  updateConfigFile({ auth: "next-auth" });
  // 9. Instruct user to add the <Provider /> to their root layout.
  addContextProviderToLayout("NextAuthProvider");
  if (orm === "prisma") await prismaGenerate(preferredPackageManager);
  consola.success("Successfully added Next Auth to your project!");

  providers.forEach((provider) => {
    consola.info(
      `To get up and running with ${provider}, create credentials at ${AuthProviders[provider].website}`
    );
    consola.info(
      `and remember to add /api/auth/callback/${provider} to your ${provider} app's redirect URIs`
    );
  });
};
