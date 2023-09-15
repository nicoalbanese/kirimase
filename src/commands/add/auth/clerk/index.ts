// 1. Mount <ClerkProvider />
// 2. Add Env keys in env.mjs too
// 3. Add middleware
// 4. Scaffold Signup and Signin pages
// 5. Add UserButton to Page.tsx
// 6. Add lib/auth/utils.ts
// 7. install package - @clerk/nextjs

import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addContextProviderToLayout } from "../../utils.js";
import { clerkGenerators } from "./generators.js";

export const addClerk = async () => {
  const { rootPath, preferredPackageManager } = readConfigFile();
  const {
    generateAuthUtilsTs,
    generateMiddlewareTs,
    generateSignInPageTs,
    generateSignUpPageTs,
    homePageWithUserButton,
  } = clerkGenerators;
  addContextProviderToLayout("ClerkProvider");
  addToDotEnv(
    [
      { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", value: "", public: true },
      { key: "CLERK_SECRET_KEY", value: "" },
      { key: "NEXT_PUBLIC_CLERK_SIGN_IN_URL", value: "/sign-in", public: true },
      { key: "NEXT_PUBLIC_CLERK_SIGN_UP_URL", value: "/sign-up", public: true },
      { key: "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", value: "/", public: true },
      { key: "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", value: "/", public: true },
    ],
    rootPath
  );
  createFile(rootPath.concat("middleware.ts"), generateMiddlewareTs());

  createFile(
    rootPath.concat("app/sign-in/[[...sign-in]]/page.tsx"),
    generateSignInPageTs()
  );
  createFile(
    rootPath.concat("app/sign-up/[[...sign-up]]/page.tsx"),
    generateSignUpPageTs()
  );

  replaceFile(rootPath.concat("app/page.tsx"), homePageWithUserButton());

  createFile(rootPath.concat("lib/auth/utils.ts"), generateAuthUtilsTs());

  await installPackages(
    { regular: "@clerk/nextjs", dev: "" },
    preferredPackageManager
  );
  addPackageToConfig("clerk");
  updateConfigFile({ auth: "clerk" });
  consola.success("Successfully added Clerk to your project!");
  consola.info(
    "Head over to https://dashboard.clerk.com/apps/new to create a new Clerk app"
  );
};
