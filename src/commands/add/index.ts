import { checkbox } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { addTrpc } from "./trpc/index.js";
import { addDrizzle } from "./drizzle/index.js";
import { readConfigFile } from "../../utils.js";
import { initProject } from "../init/index.js";
import { consola } from "consola";

export const addPackage = async () => {
  const config = readConfigFile();

  if (config) {
    const { packages } = config;
    const packageToInstall = await checkbox({
      message: "Select a package to add",
      choices: Packages.filter((p) => !packages.includes(p.value)),
    });

    if (packageToInstall.includes("drizzle")) await addDrizzle();
    if (packageToInstall.includes("trpc")) await addTrpc();
  } else {
    consola.warn("No config file found, initializing project...");
    initProject();
  }
};
