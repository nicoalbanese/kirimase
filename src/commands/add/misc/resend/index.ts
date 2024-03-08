import {
  addPackageToConfig,
  createFile,
  readConfigFile,
} from "../../../../utils.js";
import { AvailablePackage } from "../../../../types.js";
import { resendGenerators } from "./generators.js";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { addToInstallList } from "../../utils.js";

export const addResend = async (packagesBeingInstalled: AvailablePackage[]) => {
  const {
    // packages: installedPackages,
    orm,
    preferredPackageManager,
    rootPath,
  } = readConfigFile();
  const { resend } = getFilePaths();

  // const packages = packagesBeingInstalled.concat(installedPackages);
  // consola.start("Installing Resend...");

  const {
    generateResendPage,
    generateEmailUtilsTs,
    generateEmailIndexTs,
    generateApiRoute,
    generateEmailTemplateComponent,
  } = resendGenerators;

  // 1. Add page at app/resend/page.tsx
  await createFile(
    formatFilePath(resend.resendPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateResendPage()
  );

  // 2. Add component at components/emails/FirstEmailTemplate.tsx
  await createFile(
    formatFilePath(resend.firstEmailComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailTemplateComponent()
  );
  // 3. Add route handler at app/api/email/route.ts
  await createFile(
    formatFilePath(resend.emailApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateApiRoute()
  );

  // 4. Add email utils
  await createFile(
    formatFilePath(resend.emailUtils, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailUtilsTs()
  );

  // 5. add email index.ts
  await createFile(
    formatFilePath(resend.libEmailIndex, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateEmailIndexTs()
  );

  // 6. Add items to .env
  await addToDotEnv([{ key: "RESEND_API_KEY", value: "" }], rootPath, true);
  // 7. Install packages (resend)
  // await installPackages(
  //   {
  //     regular: `resend${orm === null ? " zod @t3-oss/env-nextjs" : ""}`,
  //     dev: "",
  //   },
  //   preferredPackageManager
  // );

  addToInstallList({ regular: ["resend"], dev: [] });
  if (orm === null || orm === undefined)
    addToInstallList({ regular: ["zod", "@t3-oss/env-nextjs"], dev: [] });

  await addPackageToConfig("resend");
  // consola.success("Resend successfully installed and configured.");
};
