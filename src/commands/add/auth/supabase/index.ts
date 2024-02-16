/*
 1. Add Env keys in env.mjs too
  2. Add middleware
  3. Scaffold Signup and Signin pages
  4. Create Signout button
  5. Create AuthForm component
  6. Create Home page
  7. Create Loading page
  8. Add API routes
  9. Add Supabase helpers
  10. Add Supabase packages
  11. Add package to config
  12. Update config file
*/

import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  updateConfigFile,
} from "../../../../utils.js";
import { supabaseGenerators } from "./generators.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToInstallList } from "../../utils.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
export const addSupabase = async () => {
  const { orm, rootPath, componentLib } = readConfigFile();
  const { supabase, shared } = getFilePaths();

  const {
    generateMiddleware,
    generateViewsAndComponents,
    generateSupabaseHelpers,
    generateApiRoutes,
    generateAuthDirFiles,
  } = supabaseGenerators;

  await addToDotEnv(
    [
      {
        key: "NEXT_PUBLIC_SUPABASE_URL",
        value: "your-project-url",
        public: true,
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        value: "your-anon-key",
        public: true,
      },
    ],
    rootPath
  );

  await createFile(
    formatFilePath(supabase.middleware, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateMiddleware()
  );

  const useShadCnUI = componentLib === "shadcn-ui";

  // create auth form component
  // generate sign-in and sign-up pages
  const viewsAndComponents = generateViewsAndComponents(useShadCnUI);

  // create signIn Page
  await createFile(
    formatFilePath(supabase.signInPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    viewsAndComponents.signInPage
  );

  // create signUp Page
  await createFile(
    formatFilePath(supabase.signUpPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    viewsAndComponents.signUpPage
  );

  // create signOut Button
  await createFile(
    formatFilePath(supabase.signOutButtonComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    viewsAndComponents.signOutButtonComponent
  );

  // create auth form component
  await createFile(
    formatFilePath(supabase.authFormComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    viewsAndComponents.authFormComponent
  );

  // create home Page
  await createFile(
    formatFilePath(shared.init.dashboardRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    viewsAndComponents.homePage
  );

  await createFile(
    rootPath.concat("app/loading.tsx"),
    viewsAndComponents.loadingPage
  );

  // add API routes
  const apiRoute = generateApiRoutes();

  await createFile(
    formatFilePath(supabase.callbackApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoute
  );

  const authDirFiles = generateAuthDirFiles();

  // create auth utility functions
  await createFile(
    formatFilePath(shared.auth.authUtils, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    authDirFiles.utilsTs
  );

  // create auth actions
  await createFile(
    formatFilePath(shared.auth.authActions, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    authDirFiles.actionTs
  );

  const helpers = generateSupabaseHelpers();

  // generate supabase helpers
  await createFile(
    formatFilePath(supabase.libSupabaseAuthHelpers, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    helpers
  );

  const supabasePackages = ["@supabase/supabase-js", "@supabase/ssr"];
  // const adapterPackage = orm === "drizzle" && ["postgres"];
  const packagesToInstall = [...supabasePackages];

  addToInstallList({ regular: packagesToInstall, dev: [] });

  // add package to config
  await addPackageToConfig("supabase");
  await updateConfigFile({ auth: "supabase" });
};
