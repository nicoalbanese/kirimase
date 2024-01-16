import { confirm } from "@inquirer/prompts";
import {
  installPackages,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../utils.js";
import { addDrizzle } from "./orm/drizzle/index.js";
import { addNextAuth } from "./auth/next-auth/index.js";
import { addTrpc } from "./misc/trpc/index.js";
import { installShadcnUI } from "./componentLib/shadcn-ui/index.js";
import { consola } from "consola";
import { initProject } from "../init/index.js";
import { addPrisma } from "./orm/prisma/index.js";
import { ORMType, InitOptions } from "../../types.js";
import { addClerk } from "./auth/clerk/index.js";
import { addResend } from "./misc/resend/index.js";
import { addLucia } from "./auth/lucia/index.js";
import { createAccountSettingsPage } from "./auth/shared/index.js";
import { addStripe } from "./misc/stripe/index.js";
import { checkForExistingPackages } from "../init/utils.js";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { addKinde } from "./auth/kinde/index.js";
import { addNavbarAndSettings } from "./misc/navbar/generators.js";
import {
  generateGlobalsCss,
  generateUpdatedTWConfig,
} from "./misc/defaultStyles/generators.js";

import {
  askAuth,
  askAuthProvider,
  askComponentLib,
  askDbProvider,
  askDbType,
  askMiscPackages,
  askOrm,
} from "./prompts.js";

const promptUser = async (options?: InitOptions): Promise<InitOptions> => {
  const config = readConfigFile();
  console.log(config);

  // prompt component lib
  const componentLib = config.componentLib
    ? undefined
    : await askComponentLib(options);

  // prompt orm
  let orm: ORMType;
  orm = config.orm ? undefined : await askOrm(options);
  if (orm === null) {
    const confirmedNoORM = await confirm({
      message:
        "Are you sure you don't want to install an ORM? Note: you will not be able to install any auth.",
    });
    if (confirmedNoORM === false) {
      orm = await askOrm(options);
    }
  }

  // prompt db type
  const dbType =
    orm === null || config.driver ? undefined : await askDbType(options);

  const dbProvider =
    orm === null ||
    (config.driver && config.t3 === true) ||
    (config.provider && config.t3 === false)
      ? undefined
      : await askDbProvider(options, dbType, config.preferredPackageManager);

  const auth = config.auth || !orm ? undefined : await askAuth(options);

  const authProviders =
    auth === "next-auth"
      ? options?.authProviders || (await askAuthProvider())
      : undefined;

  const packagesToInstall =
    options.miscPackages || (await askMiscPackages(config.packages));

  return {
    componentLib,
    orm,
    dbProvider,
    db: dbType,
    auth,
    authProviders,
    miscPackages: packagesToInstall,
  };
};

export const addPackage = async (options?: InitOptions) => {
  const initialConfig = readConfigFile();

  if (initialConfig) {
    if (initialConfig.packages?.length === 0)
      await checkForExistingPackages(initialConfig.rootPath);
    const config = readConfigFile();
    const { shared } = getFilePaths();

    const promptResponse = await promptUser(options);
    consola.box(promptResponse);

    // if (config.componentLib === undefined) {
    //   if (promptResponse.componentLib === "shadcn-ui")
    //     await installShadcnUI([]);
    //   if (promptResponse.componentLib === null) {
    //     consola.info("Installing Lucide React for icons.");
    //     await installPackages(
    //       { regular: "lucide-react", dev: "" },
    //       config.preferredPackageManager
    //     );
    //     // add to tailwindconfig
    //     replaceFile("tailwind.config.ts", generateUpdatedTWConfig());
    //
    //     // add to globalcss colors
    //     replaceFile(
    //       formatFilePath(shared.init.globalCss, {
    //         removeExtension: false,
    //         prefix: "rootPath",
    //       }),
    //       generateGlobalsCss()
    //     );
    //     updateConfigFile({ componentLib: null });
    //   }
    // }
    //
    // // check if orm
    // if (config.orm === undefined) {
    //   if (promptResponse.orm === "drizzle")
    //     await addDrizzle(
    //       promptResponse.db,
    //       promptResponse.dbProvider,
    //       promptResponse.includeExample,
    //       options
    //     );
    //   if (promptResponse.orm === "prisma") await addPrisma(options);
    //   if (promptResponse === null)
    //     updateConfigFile({ orm: null, driver: null, provider: null });
    // }
    // // check if auth
    // if (config.auth === undefined) {
    //   // const { orm: ormPostPrompt } = readConfigFile();
    //   // if (ormPostPrompt === undefined) {
    //   //   consola.warn(
    //   //     "You cannot install an authentication package without an ORM."
    //   //   );
    //   //   consola.info("Please run `kirimase init` again.");
    //   //   consola.info(
    //   //     "If you are seeing this message, it is likely because you misspelled your 'orm' option."
    //   //   );
    //   //   consola.info("Your requested option: -o", options.orm);
    //   //   consola.info("Available options: -o prisma, -o drizzle");
    //   //   process.exit(0);
    //   // }
    //
    //   if (promptResponse.auth === "next-auth")
    //     await addNextAuth(promptResponse.authProviders, options);
    //   if (promptResponse.auth === "clerk") await addClerk();
    //   if (promptResponse.auth === "lucia") await addLucia();
    //   if (promptResponse.auth === "kinde") await addKinde();
    //   if (promptResponse.auth === null) {
    //     updateConfigFile({ auth: null });
    //   } else {
    //     // add account page
    //     await createAccountSettingsPage();
    //   }
    //   addNavbarAndSettings();
    // }
    //
    // // check if misc
    //
    // if (promptResponse.miscPackages.includes("trpc")) await addTrpc();
    // if (promptResponse.miscPackages.includes("shadcn-ui"))
    //   await installShadcnUI(promptResponse.miscPackages);
    // if (promptResponse.miscPackages.includes("resend"))
    //   await addResend(promptResponse.miscPackages);
    // if (promptResponse.miscPackages.includes("stripe"))
    //   await addStripe(promptResponse.miscPackages);
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(options);
  }
};
