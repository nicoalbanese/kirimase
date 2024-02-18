import { select } from "@inquirer/prompts";
import { createConfigFile, sendEvent } from "../../utils.js";
import { InitOptions, PMType } from "../../types.js";
import { consola } from "consola";
import { addPackage } from "../add/index.js";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { checkForPackageManager } from "./utils.js";
import figlet from "figlet";
import chalk from "chalk";

export async function initProject(options?: InitOptions) {
  const nextjsProjectExists = existsSync("package.json");
  if (!nextjsProjectExists) {
    consola.fatal(
      "No Next.js project detected. Please create a Next.js project and then run `kirimase init` within that directory."
    );
    process.exit(0);
  }
  const usingAppDirWithSrc = existsSync(path.join(process.cwd(), "src/app"));
  const usingAppDirWithOutSrc = existsSync(path.join(process.cwd(), "app"));
  if (!usingAppDirWithOutSrc && !usingAppDirWithSrc) {
    consola.fatal("Kirimase only works with the Next.js App Directory.");
    process.exit(0);
  }

  console.clear();
  console.log("\n");
  console.log(chalk(figlet.textSync("Kirimase", { font: "ANSI Shadow" })));
  const srcExists =
    usingAppDirWithSrc ??
    options.hasSrcFolder ??
    (await select({
      message: "Are you using a 'src' folder?",
      choices: [
        { name: "Yes", value: true },
        { name: "No", value: false },
      ],
    }));

  // console.log(options);
  const preferredPackageManager =
    checkForPackageManager() ||
    options?.packageManager ||
    ((await select({
      message: "Please pick your preferred package manager",
      choices: [
        { name: "NPM", value: "npm" },
        { name: "Yarn", value: "yarn" },
        { name: "PNPM", value: "pnpm" },
        { name: "Bun", value: "bun" },
      ],
    })) as PMType);
  // console.log("installing dependencies with", preferredPackageManager);

  const tsConfigExists = existsSync("tsconfig.json");
  if (!tsConfigExists) {
    consola.info("No TSConfig found...");
    consola.fatal("Kirimase is only compatible with Typescript projects.");
    process.exit(0);
  }
  const tsConfigString = readFileSync("tsconfig.json", "utf-8");
  let alias: string = "@";
  if (tsConfigString.includes("@/*")) alias = "@";
  if (tsConfigString.includes("~/*")) alias = "~";

  createConfigFile({
    driver: undefined,
    hasSrc: srcExists,
    provider: undefined,
    packages: [],
    preferredPackageManager,
    orm: undefined,
    auth: undefined,
    componentLib: undefined,
    t3: false,
    alias,
    analytics: true,
  });
  // consola.success("Kirimase initialized!");
  // consola.info("You can now add packages.");
  addPackage(options, true);
}
