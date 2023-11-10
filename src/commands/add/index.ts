import { checkbox, select, Separator } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { readConfigFile, replaceFile, updateConfigFile } from "../../utils.js";
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
} from "../../types.js";
import { addClerk } from "./auth/clerk/index.js";
import { addResend } from "./misc/resend/index.js";
import { addLucia } from "./auth/lucia/index.js";
import { createAccountSettingsPage } from "./auth/shared/index.js";
import { addStripe } from "./misc/stripe/index.js";
import { checkForExistingPackages } from "../init/utils.js";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { addKinde } from "./auth/kinde/index.js";

export const addPackage = async (options?: InitOptions) => {
  const config = readConfigFile();

  if (config) {
    if (config.packages?.length === 0)
      await checkForExistingPackages(config.rootPath);
    const { packages, orm, auth, componentLib, rootPath } = readConfigFile();
    const { shared } = getFilePaths();

    const nullOption = { name: "None", value: null };

    if (componentLib === undefined) {
      const componentLibToInstall =
        options?.componentLib ||
        ((await select({
          message: "Select a component library to use:",
          choices: [...Packages.componentLib, new Separator(), nullOption],
        })) as ComponentLibType | null);

      if (componentLibToInstall === "shadcn-ui") await installShadcnUI([]);
      if (componentLibToInstall === null) {
        replaceFile(
          formatFilePath(shared.init.globalCss, {
            removeExtension: false,
            prefix: "rootPath",
          }),
          `@tailwind base;\n@tailwind components;\n@tailwind utilities;
`
        );
        updateConfigFile({ componentLib: null });
      }
    }

    // check if orm
    if (orm === undefined) {
      const ormToInstall =
        options?.orm ||
        ((await select({
          message: "Select an ORM to use:",
          choices: [...Packages.orm, new Separator(), nullOption],
          // choices: [...Packages.orm],
        })) as ORMType | null);

      if (ormToInstall === "drizzle") await addDrizzle(options);
      if (ormToInstall === "prisma") await addPrisma(options);
      if (ormToInstall === null)
        updateConfigFile({ orm: null, driver: null, provider: null });
    }
    // check if auth
    if (auth === undefined) {
      const { orm: ormPostPrompt } = readConfigFile();
      if (ormPostPrompt === undefined) {
        consola.warn(
          "You cannot install an authentication package without an ORM."
        );
        consola.info("Please run `kirimase init` again.");
        consola.info(
          "If you are seeing this message, it is likely because you misspelled your 'orm' option."
        );
        consola.info("Your requested option: -o", options.orm);
        consola.info("Available options: -o prisma, -o drizzle");
        process.exit(0);
      }
      const authToInstall =
        options?.auth ||
        ((await select({
          message: "Select an authentication package to use:",
          choices: [...Packages.auth, new Separator(), nullOption],
        })) as AuthType | null);

      if (authToInstall === "next-auth") await addNextAuth(options);
      if (authToInstall === "clerk") await addClerk();
      if (authToInstall === "lucia") await addLucia();
      if (authToInstall === "kinde") await addKinde();
      if (authToInstall === null) {
        updateConfigFile({ auth: null });
      } else {
        // add account page
        await createAccountSettingsPage();
      }
    }

    // check if misc
    let uninstalledPackages: PackageChoice[] = [];
    if (packages.length === 0) {
      const { packages: packagesPostOrmAndAuth } = readConfigFile();
      uninstalledPackages = Packages.misc.filter(
        (p) => !packagesPostOrmAndAuth.includes(p.value)
      );
    } else {
      uninstalledPackages = Packages.misc.filter(
        (p) => !packages.includes(p.value)
      );
    }
    if (uninstalledPackages.length > 0) {
      const packageToInstall =
        options?.miscPackages ||
        (await checkbox({
          message: "Select any miscellaneous packages to add:",
          choices: uninstalledPackages,
        }));

      if (packageToInstall.includes("trpc")) await addTrpc();
      if (packageToInstall.includes("shadcn-ui"))
        await installShadcnUI(packageToInstall);
      if (packageToInstall.includes("resend"))
        await addResend(packageToInstall);
      if (packageToInstall.includes("stripe"))
        await addStripe(packageToInstall);
    } else {
      consola.info("All available packages are already installed");
    }
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(options);
  }
};
