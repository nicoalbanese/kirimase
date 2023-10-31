// Init Project Check list
// 1. Parse DB Type [x]
// 2. Figure out lib path [x]
// 3. Create Drizzle Config JSON [x]
// 4. Create index.ts, schema folder (with models inside), migrate.ts, seed.ts (optional)
// 5. Install Dependencies
// 6. Update tsconfig.json (change to esnext)
// 7. Update package.json (add scripts)
// 8. Add .env with database_url

import { select } from "@inquirer/prompts";
import { createConfigFile } from "../../utils.js";
import { InitOptions, PMType } from "../../types.js";
import { consola } from "consola";
import { addPackage } from "../add/index.js";
import { existsSync } from "fs";

export async function initProject(options?: InitOptions) {
  const nextjsProjectExists = existsSync("package.json");
  if (!nextjsProjectExists) {
    consola.fatal(
      "No Next.js project detected. Please create a Next.js project and then run `kirimase init` within that directory."
    );
    process.exit(0);
  }
  const srcExists =
    typeof options?.hasSrcFolder === "string"
      ? options.hasSrcFolder === "yes"
      : await select({
          message: "Are you using a 'src' folder?",
          choices: [
            { name: "Yes", value: true },
            { name: "No", value: false },
          ],
        });

  const preferredPackageManager =
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
  });
  consola.success("Kirimase initialized!");
  consola.info("You can now add packages.");
  addPackage(options);
}
