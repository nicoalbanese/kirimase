// Init Project Check list
// 1. Parse DB Type [x]
// 2. Figure out lib path [x]
// 3. Create Drizzle Config JSON [x]
// 4. Create index.ts, schema folder (with models inside), migrate.ts, seed.ts (optional)
// 5. Install Dependencies
// 6. Update tsconfig.json (change to esnext)
// 7. Update package.json (add scripts)
// 8. Add .env with database_url

import { select, input, Separator } from "@inquirer/prompts";
import { DBType, PMType, createFolder } from "../../utils.js";
import {
  addScriptsToPackageJson,
  createDotEnv,
  createDrizzleConfig,
  createIndexTs,
  createInitSchema,
  createMigrateTs,
  installDependencies,
  updateTsConfigTarget,
} from "./generators.js";

export async function initProject() {
  let libPath = "";
  const libExists = await select({
    message: "Do you have a 'lib' folder?",
    choices: [
      { name: "Yes", value: true },
      { name: "No", value: false },
    ],
  });
  if (libExists) {
    // ask for location
    libPath = await input({
      message:
        "Where is your 'lib' directory located? (relative to root - eg. src/lib or lib )",
      default: "src/lib",
    });
  } else {
    // create lib folder
    libPath = await input({
      message:
        "Please specify the relative path where you would like to create the 'lib' directory within your project.",
      default: "src/lib",
    });

    createFolder(libPath);
  }

  const dbType = (await select({
    message: "Please choose your DB type",
    choices: [
      { name: "Postgres", value: "pg" },
      new Separator(),
      {
        name: "SQLite",
        value: "sqlite",
        disabled: "SQLite is not yet supported",
      },
      {
        name: "MySQL",
        value: "MySQL",
        disabled: "SQLite is not yet supported",
      },
    ],
  })) as DBType;

  const databaseUrl = await input({
    message: "What is the database url?",
    default: "postgresql://postgres:postgres@localhost:5432/{DB_NAME}",
  });

  // create all the files here
  createInitSchema(libPath, dbType);
  createIndexTs(libPath, dbType);
  createMigrateTs(libPath, dbType);
  createDrizzleConfig(libPath, dbType);
  addScriptsToPackageJson(libPath);
  createDotEnv(databaseUrl);
  updateTsConfigTarget();

  const preferredPackageManager = (await select({
    message: "Please pick your preferred packaged manager",
    choices: [
      { name: "NPM", value: "npm" },
      { name: "Yarn", value: "yarn" },
      { name: "PNPM", value: "pnpm" },
    ],
  })) as PMType;
  // console.log("installing dependencies with", preferredPackageManager);
  installDependencies(dbType, preferredPackageManager);
}
