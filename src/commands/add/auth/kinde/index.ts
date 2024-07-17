import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  updateConfigFile,
} from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { generateUpdatedRootRoute } from "../next-auth/generators.js";
import {
  generateAuthUtils,
  generateKindeRouteHandler,
  generateSignInComponent,
  generateSignInPage,
} from "./generators.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/index.js";
import { addToInstallList } from "../../utils.js";

export const addKinde = async () => {
  const { kinde, shared } = getFilePaths();

  // add api route
  await createFile(
    formatFilePath(kinde.routeHandler, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateKindeRouteHandler()
  );

  // create signin button component
  await createFile(
    formatFilePath(shared.auth.signInComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateSignInComponent()
  );

  // create auth/utils.ts
  await createFile(
    formatFilePath(shared.auth.authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateAuthUtils()
  );

  // update root page
  await createFile(
    formatFilePath(shared.init.dashboardRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateUpdatedRootRoute()
  );

  // generate sign in page
  await createFile(
    formatFilePath(kinde.signInPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateSignInPage()
  );

  // If trpc installed, add protectedProcedure
  await updateTrpcWithSessionIfInstalled();

  // add env variables
  await addToDotEnv([
    {
      key: "KINDE_CLIENT_ID",
      value: "",
    },
    {
      key: "KINDE_CLIENT_SECRET",
      value: "",
    },
    { key: "KINDE_ISSUER_URL", value: "https://kirimase.kinde.com" },
    { key: "KINDE_SITE_URL", value: "http://localhost:3000" },
    { key: "KINDE_POST_LOGOUT_REDIRECT_URL", value: "http://localhost:3000" },
    {
      key: "KINDE_POST_LOGIN_REDIRECT_URL",
      value: "http://localhost:3000/dashboard",
    },
  ]);
  // install @kinde-oss/kinde-auth-nextjs
  // await installPackages(
  //   { regular: "@kinde-oss/kinde-auth-nextjs", dev: "" },
  //   preferredPackageManager,
  // );
  addToInstallList({ regular: ["@kinde-oss/kinde-auth-nextjs"], dev: [] });

  await addPackageToConfig("kinde");
  await updateConfigFile({ auth: "kinde" });
  // consola.success("Successfully installed Kinde auth");
};
