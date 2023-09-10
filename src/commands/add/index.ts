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

export const addPackage = async () => {
  const config = readConfigFile();

  if (config) {
    const { packages, orm, auth } = config;

    const nullOption = { name: "None", value: null };
    // check if orm
    if (orm === undefined) {
      const ormToInstall = await select({
        message: "Select an ORM to use:",
        choices: [...Packages.orm, new Separator(), nullOption],
      });

      if (ormToInstall === "drizzle") await addDrizzle();
      if (ormToInstall === "prisma") await addPrisma();
      if (ormToInstall === null)
        updateConfigFile({ orm: null, driver: null, provider: null });
    }
    // check if auth
    if (auth === undefined) {
      const authToInstall = await select({
        message: "Select an authentication package to use:",
        choices: [...Packages.auth, new Separator(), nullOption],
      });

      if (authToInstall === "next-auth") await addNextAuth();
      if (authToInstall === null) updateConfigFile({ auth: null });
    }

    // check if misc

    const uninstalledPackages = Packages.misc.filter(
      (p) => !packages.includes(p.value)
    );
    if (uninstalledPackages.length > 0) {
      const packageToInstall = await checkbox({
        message: "Select any miscellaneous packages to add:",
        choices: uninstalledPackages,
      });

      if (packageToInstall.includes("trpc")) await addTrpc();
      if (packageToInstall.includes("shadcn-ui"))
        await installShadcnUI(packageToInstall);
    } else {
      consola.info("All available packages are already installed");
    }
  } else {
    consola.warn("No config file found, initializing project...");
    initProject();
  }
};
