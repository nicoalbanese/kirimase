import { consola } from "consola";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
} from "../../../../utils.js";
import { AvailablePackage } from "../../../../types.js";
import { resendGenerators } from "./generators.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";

export const addResend = async (packagesBeingInstalled: AvailablePackage[]) => {
  const {
    // packages: installedPackages,
    orm,
    preferredPackageManager,
    rootPath,
  } = readConfigFile();
  // const packages = packagesBeingInstalled.concat(installedPackages);
  consola.start("Installing Resend...");

  const {
    generateResendPage,
    generateEmailUtilsTs,
    generateEmailIndexTs,
    generateApiRoute,
    generateEmailTemplateComponent,
  } = resendGenerators;

  // 1. Add page at app/resend/page.tsx
  createFile(rootPath.concat("app/resend/page.tsx"), generateResendPage());

  // 2. Add component at components/emails/FirstEmailTemplate.tsx
  createFile(
    rootPath.concat("components/emails/FirstEmail.tsx"),
    generateEmailTemplateComponent()
  );
  // 3. Add route handler at app/api/email/route.ts
  createFile(rootPath.concat("app/api/email/route.ts"), generateApiRoute());

  // 4. Add email utils
  createFile(rootPath.concat("lib/email/utils.ts"), generateEmailUtilsTs());

  // 5. add email index.ts
  createFile(rootPath.concat("lib/email/index.ts"), generateEmailIndexTs());

  // 6. Add items to .env
  addToDotEnv([{ key: "RESEND_API_KEY", value: "" }], rootPath, true);
  // 7. Install packages (resend)
  installPackages(
    {
      regular: `resend${orm === null ? " zod@3.21.4 @t3-oss/env-nextjs" : ""}`,
      dev: "",
    },
    preferredPackageManager
  );
  addPackageToConfig("resend");
  consola.success("Resend successfully installed and configured.");
};
