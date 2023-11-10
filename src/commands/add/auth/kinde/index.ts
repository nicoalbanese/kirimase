import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
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
} from "./generators.js";

export const addKinde = async () => {
  const { kinde, shared } = getFilePaths();
  const { preferredPackageManager } = readConfigFile();
  // add api route
  createFile(
    formatFilePath(kinde.routeHandler, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateKindeRouteHandler()
  );
  // create signin button component
  createFile(
    formatFilePath(shared.auth.signInComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateSignInComponent()
  );
  // create auth/utils.ts
  createFile(
    formatFilePath(shared.auth.authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateAuthUtils()
  );
  // update root page
  createFile(
    formatFilePath("app/page.tsx", {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateUpdatedRootRoute()
  );
  // add env variables
  addToDotEnv([
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
    { key: "KINDE_POST_LOGIN_REDIRECT_URL", value: "http://localhost:3000" },
  ]);
  // install @kinde-oss/kinde-auth-nextjs
  await installPackages(
    { regular: "@kinde-oss/kinde-auth-nextjs", dev: "" },
    preferredPackageManager
  );
  addPackageToConfig("kinde");
  updateConfigFile({ auth: "kinde" });
  consola.success("Successfully installed Kinde auth");
};
