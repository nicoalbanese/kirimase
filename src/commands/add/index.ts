import { checkbox } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { addTrpc } from "./trpc/index.js";
import { addDrizzle } from "./drizzle/index.js";
import { readConfigFile } from "../../utils.js";
import { initProject } from "../init/index.js";
import { consola } from "consola";
import { addNextAuth } from "./next-auth/index.js";
import { installShadcnUI } from "./shadcn-ui/index.js";

export const addPackage = async () => {
  const config = readConfigFile();

  if (config) {
    const { packages } = config;
    const uninstalledPackages = Packages.filter(
      (p) => !packages.includes(p.value)
    );
    if (uninstalledPackages.length > 0) {
      const packageToInstall = await checkbox({
        message: "Select a package to add",
        choices: uninstalledPackages,
      });

      if (packageToInstall.includes("drizzle")) await addDrizzle();
      if (packageToInstall.includes("trpc")) await addTrpc();
      if (packageToInstall.includes("next-auth")) await addNextAuth();
      if (packageToInstall.includes("shadcn-ui"))
        await installShadcnUI(packageToInstall.concat(packages));
    } else {
      consola.info("All available packages are already installed");
    }
  } else {
    consola.warn("No config file found, initializing project...");
    initProject();
  }
};
