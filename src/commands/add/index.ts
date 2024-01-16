import { checkbox, confirm, select, Separator } from "@inquirer/prompts";
import { Packages } from "./utils.js";
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
import {
  AuthType,
  ComponentLibType,
  ORMType,
  PackageChoice,
  InitOptions,
  DBProvider,
  DBType,
  AvailablePackage,
} from "../../types.js";
import { addClerk } from "./auth/clerk/index.js";
import { addResend } from "./misc/resend/index.js";
import { addLucia } from "./auth/lucia/index.js";
import { createAccountSettingsPage } from "./auth/shared/index.js";
import { addStripe } from "./misc/stripe/index.js";
import { checkForExistingPackages, DBProviders } from "../init/utils.js";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { addKinde } from "./auth/kinde/index.js";
import { addNavbarAndSettings } from "./misc/navbar/generators.js";
import {
  generateGlobalsCss,
  generateUpdatedTWConfig,
} from "./misc/defaultStyles/generators.js";
import { AuthProvider, AuthProviders } from "./auth/next-auth/utils.js";
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

  const currentConfig: InitOptions = {};
  // prompt component lib
  const componentLib = await askComponentLib(options);

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
    orm === null || (config.driver && config.t3 === true)
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
  const config = readConfigFile();

  if (config) {
    if (config.packages?.length === 0)
      await checkForExistingPackages(config.rootPath);
    const {
      packages,
      orm,
      auth,
      componentLib,
      rootPath,
      t3,
      preferredPackageManager,
    } = readConfigFile();
    const { shared } = getFilePaths();

    const nullOption = { name: "None", value: null };

    const initOptions = await promptUser(options);
    consola.box(initOptions);

    // if (componentLib === undefined) {
    //   const componentLibToInstall =
    //     options?.componentLib ||
    //     ((await select({
    //       message: "Select a component library to use:",
    //       choices: [...Packages.componentLib, new Separator(), nullOption],
    //     })) as ComponentLibType | null);
    //
    //   if (componentLibToInstall === "shadcn-ui") await installShadcnUI([]);
    //   if (componentLibToInstall === null) {
    //     consola.info("Installing Lucide React for icons.");
    //     await installPackages(
    //       { regular: "lucide-react", dev: "" },
    //       preferredPackageManager
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
    // if (orm === undefined) {
    //   const ormToInstall =
    //     options?.orm ||
    //     ((await select({
    //       message: "Select an ORM to use:",
    //       choices: [...Packages.orm, new Separator(), nullOption],
    //       // choices: [...Packages.orm],
    //     })) as ORMType | null);
    //
    //   if (ormToInstall === "drizzle")
    //     await addDrizzle(initOptions.db, initOptions.dbProvider, options);
    //   if (ormToInstall === "prisma") await addPrisma(options);
    //   if (ormToInstall === null)
    //     updateConfigFile({ orm: null, driver: null, provider: null });
    // }
    // // check if auth
    // if (auth === undefined) {
    //   const { orm: ormPostPrompt } = readConfigFile();
    //   if (ormPostPrompt === undefined) {
    //     consola.warn(
    //       "You cannot install an authentication package without an ORM."
    //     );
    //     consola.info("Please run `kirimase init` again.");
    //     consola.info(
    //       "If you are seeing this message, it is likely because you misspelled your 'orm' option."
    //     );
    //     consola.info("Your requested option: -o", options.orm);
    //     consola.info("Available options: -o prisma, -o drizzle");
    //     process.exit(0);
    //   }
    //   const authToInstall =
    //     options?.auth ||
    //     ((await select({
    //       message: "Select an authentication package to use:",
    //       choices: [...Packages.auth, new Separator(), nullOption],
    //     })) as AuthType | null);
    //
    //   if (authToInstall === "next-auth")
    //     await addNextAuth(initOptions.authProviders, options);
    //   if (authToInstall === "clerk") await addClerk();
    //   if (authToInstall === "lucia") await addLucia();
    //   if (authToInstall === "kinde") await addKinde();
    //   if (authToInstall === null) {
    //     updateConfigFile({ auth: null });
    //   } else {
    //     // add account page
    //     await createAccountSettingsPage();
    //   }
    //   addNavbarAndSettings();
    // }
    //
    // // check if misc
    // let uninstalledPackages: PackageChoice[] = [];
    // if (packages.length === 0) {
    //   const { packages: packagesPostOrmAndAuth } = readConfigFile();
    //   uninstalledPackages = Packages.misc.filter(
    //     (p) => !packagesPostOrmAndAuth.includes(p.value)
    //   );
    // } else {
    //   uninstalledPackages = Packages.misc.filter(
    //     (p) => !packages.includes(p.value)
    //   );
    // }
    // if (uninstalledPackages.length > 0) {
    //   const packageToInstall =
    //     options?.miscPackages ||
    //     (await checkbox({
    //       message: "Select any miscellaneous packages to add:",
    //       choices: uninstalledPackages,
    //     }));
    //
    //   if (packageToInstall.includes("trpc")) await addTrpc();
    //   if (packageToInstall.includes("shadcn-ui"))
    //     await installShadcnUI(packageToInstall);
    //   if (packageToInstall.includes("resend"))
    //     await addResend(packageToInstall);
    //   if (packageToInstall.includes("stripe"))
    //     await addStripe(packageToInstall);
    // } else {
    //   consola.info("All available packages are already installed");
    // }
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(options);
  }
};
