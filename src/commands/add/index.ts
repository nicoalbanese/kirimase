import { confirm } from "@inquirer/prompts";
import {
  createFile,
  installPackages,
  readConfigFile,
  replaceFile,
  sendEvent,
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
  createAppLayoutFile,
  createAuthLayoutFile,
  createLandingPage,
  generateGenericHomepage,
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
  askPscale,
} from "./prompts.js";
import {
  addAuthCheckToAppLayout,
  addContextProviderToAppLayout,
  addToInstallList,
  installPackagesFromList,
  installShadcnComponentList,
  printNextSteps,
} from "./utils.js";
import ora from "ora";
import { checkAndAddAuthUtils } from "./auth/next-auth/utils.js";

const promptUser = async (options?: InitOptions): Promise<InitOptions> => {
  const config = readConfigFile();
  // console.log(config);

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
        "Are you sure you don't want to install an ORM? Note: you will not be able to install auth or Stripe.",
    });
    if (confirmedNoORM === false) {
      orm = await askOrm(options);
    }
  }

  // prompt db type
  const dbType =
    orm === null || config.driver ? undefined : await askDbType(options);

  let dbProvider =
    config.orm ||
    orm === "prisma" ||
    orm === null ||
    (config.driver && config.t3 === true) ||
    (config.provider && config.t3 === false)
      ? undefined
      : await askDbProvider(options, dbType, config.preferredPackageManager);

  if (orm === "prisma" && dbType === "mysql") {
    const usePscale = await askPscale(options);
    if (usePscale) dbProvider = "planetscale";
  }

  const auth = config.auth || !orm ? undefined : await askAuth(options);

  const authProviders =
    auth === "next-auth"
      ? options?.authProviders || (await askAuthProvider())
      : undefined;

  const hasOrmAndAuth = !!(
    config.auth ||
    (auth && auth !== null && (config.orm || (orm && orm !== null)))
  );
  const packagesToInstall =
    options.miscPackages ||
    (await askMiscPackages(config.packages, hasOrmAndAuth));

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

export const spinner = ora();

export const addPackage = async (
  options?: InitOptions,
  init: boolean = false
) => {
  const initialConfig = readConfigFile();

  if (initialConfig) {
    if (initialConfig.packages?.length === 0)
      await checkForExistingPackages(initialConfig.rootPath);
    const config = readConfigFile();
    const { shared } = getFilePaths();

    console.log("\n");
    const promptResponse = await promptUser(options);
    const start = Date.now();
    spinner.start();
    spinner.text = "Beginning Configuration Process";

    createAppLayoutFile();
    createLandingPage();

    if (config.componentLib === undefined) {
      if (promptResponse.componentLib === "shadcn-ui") {
        spinner.text = "Configuring Shadcn-UI";
        await installShadcnUI([]);
      }
      if (promptResponse.componentLib === null) {
        // consola.info("Installing Lucide React for icons.");
        spinner.text = "Configuring Base Styles";

        addToInstallList({ regular: ["lucide-react"], dev: [] });
        // await installPackages(
        //   { regular: "lucide-react", dev: "" },
        //   config.preferredPackageManager
        // );
        // add to tailwindconfig
        replaceFile("tailwind.config.ts", generateUpdatedTWConfig());

        // add to globalcss colors
        replaceFile(
          formatFilePath(shared.init.globalCss, {
            removeExtension: false,
            prefix: "rootPath",
          }),
          generateGlobalsCss()
        );
        updateConfigFile({ componentLib: null });
      }
      if (!config.t3) {
        addContextProviderToAppLayout("Navbar");
      }
    }

    // check if orm
    if (config.orm === undefined) {
      if (promptResponse.orm === "drizzle") {
        spinner.text = "Configuring Drizzle ORM";

        await addDrizzle(
          promptResponse.db,
          promptResponse.dbProvider,
          promptResponse.includeExample,
          options
        );
      }
      if (promptResponse.orm === "prisma") {
        spinner.text = "Configuring Prisma";

        await addPrisma(
          promptResponse.includeExample,
          promptResponse.db,
          options
        );
      }
      if (promptResponse === null)
        updateConfigFile({ orm: null, driver: null, provider: null });
    }
    // check if auth
    if (config.auth === undefined) {
      if (promptResponse.auth && promptResponse.auth !== null)
        spinner.text =
          "Configuring " +
          promptResponse.auth[0].toUpperCase() +
          promptResponse.orm.slice(1);

      if (promptResponse.auth !== null && promptResponse.auth !== undefined)
        createAuthLayoutFile();

      if (promptResponse.auth === "next-auth")
        await addNextAuth(promptResponse.authProviders, options);
      if (promptResponse.auth === "clerk") await addClerk();
      if (promptResponse.auth === "lucia") await addLucia();
      if (promptResponse.auth === "kinde") await addKinde();
      if (promptResponse.auth === null || promptResponse.auth === undefined) {
        replaceFile(
          formatFilePath(shared.init.dashboardRoute, {
            prefix: "rootPath",
            removeExtension: false,
          }),
          generateGenericHomepage()
        );
        updateConfigFile({ auth: null });
      } else {
        // add account page
        await createAccountSettingsPage();
        addAuthCheckToAppLayout();
      }
      addNavbarAndSettings();
    }

    // check if misc

    if (promptResponse.miscPackages.includes("trpc")) {
      spinner.text = "Configuring tRPC";
      await addTrpc();
    }
    if (promptResponse.miscPackages.includes("shadcn-ui"))
      await installShadcnUI(promptResponse.miscPackages);
    if (promptResponse.miscPackages.includes("resend")) {
      spinner.text = "Configuring Resend";
      await addResend(promptResponse.miscPackages);
    }
    if (promptResponse.miscPackages.includes("stripe")) {
      spinner.text = "Configuring Stripe";
      await addStripe(promptResponse.miscPackages);
    }

    if (config.t3 && config.auth === "next-auth") {
      checkAndAddAuthUtils();
    }

    if (init === true) {
      await sendEvent("init_config", {});
    } else {
      await sendEvent("add_package", {
        newPackages: promptResponse.miscPackages,
      });
    }

    spinner.succeed("Configuration complete");

    await installPackagesFromList();
    await installShadcnComponentList();

    const end = Date.now();
    const duration = end - start;

    printNextSteps(promptResponse, duration);
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(options);
  }
};
