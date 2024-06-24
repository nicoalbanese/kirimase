// 1. Mount <ClerkProvider />
// 2. Add Env keys in env.mjs too
// 3. Add middleware
// 4. Scaffold Signup and Signin pages
// 5. Add UserButton to Page.tsx
// 6. Add lib/auth/utils.ts
// 7. install package - @clerk/nextjs

import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import {
  addContextProviderToAppLayout,
  addContextProviderToAuthLayout,
  addToInstallList,
} from "../../utils.js";
import { clerkGenerators } from "./generators.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/index.js";

export const addClerk = async () => {
  const { rootPath, componentLib } = readConfigFile();
  const {
    clerk: { middleware, signInPage, signUpPage },
    shared: {
      auth: { authUtils },
      init,
    },
  } = getFilePaths();

  const {
    generateAuthUtilsTs,
    generateMiddlewareTs,
    generateSignInPageTs,
    generateSignUpPageTs,
    homePageWithUserButton,
  } = clerkGenerators;

  await addContextProviderToAuthLayout("ClerkProvider");
  await addContextProviderToAppLayout("ClerkProvider");

  await addToDotEnv(
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
  await createFile(
    formatFilePath(middleware, { prefix: "rootPath", removeExtension: false }),
    generateMiddlewareTs()
  );

  await createFile(
    formatFilePath(signInPage, { removeExtension: false, prefix: "rootPath" }),
    generateSignInPageTs()
  );
  await createFile(
    formatFilePath(signUpPage, { removeExtension: false, prefix: "rootPath" }),
    generateSignUpPageTs()
  );

  await replaceFile(
    formatFilePath(init.dashboardRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    homePageWithUserButton(componentLib)
  );

  await createFile(
    formatFilePath(authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateAuthUtilsTs()
  );

  // If trpc installed, add protectedProcedure
  await updateTrpcWithSessionIfInstalled();

  addToInstallList({ regular: ["@clerk/nextjs"], dev: [] });
  // await installPackages(
  //   { regular: "@clerk/nextjs", dev: "" },
  //   preferredPackageManager,
  // );
  await addPackageToConfig("clerk");
  await updateConfigFile({ auth: "clerk" });
  // consola.success("Successfully added Clerk to your project!");
  // consola.info(
  //   "Head over to https://dashboard.clerk.com/apps/new to create a new Clerk app"
  // );
  //
};
