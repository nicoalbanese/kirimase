import { select } from "@inquirer/prompts";
import { Packages } from "./utils.js";
import { addTrpc } from "./trpc/index.js";

export const addPackage = async () => {
  const packageToInstall = await select({
    message: "Select a package to add",
    choices: Packages,
  });

  if (packageToInstall === "trpc") addTrpc();
};
