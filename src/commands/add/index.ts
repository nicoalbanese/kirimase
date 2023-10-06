import { checkbox, select, Separator } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { readConfigFile, updateConfigFile } from "../../utils.js";
import { addDrizzle } from "./orm/drizzle/index.js";
import { addNextAuth } from "./auth/next-auth/index.js";
import { addTrpc } from "./misc/trpc/index.js";
import { installShadcnUI } from "./misc/shadcn-ui/index.js";
import { consola } from "consola";
import { initProject } from "../init/index.js";
import { addPrisma } from "./orm/prisma/index.js";
import { AuthType, InitOptions, ORMType, PackageChoice } from "../../types.js";
import { addClerk } from "./auth/clerk/index.js";
import { addResend } from "./misc/resend/index.js";
import { addLucia } from "./auth/lucia/index.js";

export const addPackage = async (initOptions?: InitOptions) => {
  const config = readConfigFile();

  if (config) {
    const { packages, orm, auth } = config;

    const nullOption = { name: "None", value: null };
    // check if orm
    if (orm === undefined) {
      const ormToInstall = initOptions.orm || (await select({
        message: "Select an ORM to use:",
        choices: [...Packages.orm, new Separator(), nullOption],
      })) as ORMType | null;

      if (ormToInstall === "drizzle") await addDrizzle(initOptions);
      if (ormToInstall === "prisma") await addPrisma(initOptions);
      if (ormToInstall === null)
        updateConfigFile({ orm: null, driver: null, provider: null });
    }
    // check if auth
    if (auth === undefined) {
      const authToInstall = initOptions.auth || (await select({
        message: "Select an authentication package to use:",
        choices: [...Packages.auth, new Separator(), nullOption],
      })) as AuthType | null;

      if (authToInstall === "next-auth") await addNextAuth(initOptions);
      if (authToInstall === "clerk") await addClerk();
      if (authToInstall === "lucia") await addLucia();
      if (authToInstall === null) updateConfigFile({ auth: null });
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
      const packageToInstall = await checkbox({
        message: "Select any miscellaneous packages to add:",
        choices: uninstalledPackages,
      });

      if (packageToInstall.includes("trpc")) await addTrpc();
      if (packageToInstall.includes("shadcn-ui"))
        await installShadcnUI(packageToInstall);
      if (packageToInstall.includes("resend"))
        await addResend(packageToInstall);
    } else {
      consola.info("All available packages are already installed");
    }
  } else {
    consola.warn("No config file found, initializing project...");
    initProject(initOptions);
  }
};
