import { checkbox, select } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { addTrpc } from "./trpc/index.js";
import { addDrizzle } from "./drizzle/index.js";
import { readConfigFile, updateConfigFile } from "../../utils.js";
import { initProject } from "../init/index.js";
import { consola } from "consola";
import { addNextAuth } from "./next-auth/index.js";
import { installShadcnUI } from "./shadcn-ui/index.js";

export const addPackage = async () => {
  const config = readConfigFile();

  if (config) {
    const { packages, orm, auth } = config;

    const nullOption = { name: "None", value: null };
    // check if orm
    if (orm === undefined) {
      const ormToInstall = await select({
        message: "Select an ORM to use:",
        choices: Packages.orm.concat(nullOption),
      });

      if (ormToInstall === "drizzle") await addDrizzle();
      if (ormToInstall === null) updateConfigFile({ orm: null, driver: null, provider: null });
    }
    // check if auth
    if (auth === undefined) {
      const authToInstall = await select({
        message: "Select an authentication package to use:",
        choices: Packages.auth.concat(nullOption),
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
