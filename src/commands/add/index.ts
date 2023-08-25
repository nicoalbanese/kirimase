import { checkbox } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { addTrpc } from "./trpc/index.js";
import { addDrizzle } from "./drizzle/index.js";

export const addPackage = async () => {
  const packageToInstall = await checkbox({
    message: "Select a package to add",
    choices: Packages,
  });

  if (packageToInstall.includes("drizzle")) addDrizzle();
  if (packageToInstall.includes("trpc")) addTrpc();
};
