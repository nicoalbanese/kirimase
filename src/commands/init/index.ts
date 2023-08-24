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
import { createConfigFile, wrapInParenthesis } from "../../utils.js";
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
import { DBProvider, DBType, PMType } from "../../types.js";
import { DBProviders } from "./utils.js";

export async function initProject() {
  let libPath = "";
  const srcExists = await select({
    message: "Are you using a 'src' folder?",
    choices: [
      { name: "Yes", value: true },
      { name: "No", value: false },
    ],
  });
  srcExists ? (libPath = "src/lib") : (libPath = "lib");

  const dbType = (await select({
    message: "Please choose your DB type",
    choices: [
      { name: "Postgres", value: "pg" },
      // new Separator(),
      {
        name: "MySQL",
        value: "mysql",
        // disabled: wrapInParenthesis("MySQL is not yet supported"),
      },
      {
        name: "SQLite",
        value: "sqlite",
        // disabled: wrapInParenthesis("SQLite is not yet supported"),
      },
    ],
  })) as DBType;

  const dbProvider = (await select({
    message: "Please choose your DB Provider",
    choices: DBProviders[dbType],
  })) as DBProvider;

  let databaseUrl = "";

  if (dbType === "sqlite") {
    databaseUrl = "sqlite.db";
  } else {
    databaseUrl = await input({
      message: "What is the database url?",
      default:
        dbType === "pg"
          ? "postgresql://postgres:postgres@localhost:5432/{DB_NAME}"
          : "mysql://root:root@localhost:3306/{DB_NAME}",
    });
  }

  if (dbProvider === "neon")
    databaseUrl = databaseUrl.concat("?sslmode=require");

  // create all the files here
  createInitSchema(libPath, dbType);

  // dependent on dbtype and driver, create
  createIndexTs(libPath, dbType, dbProvider);
  createMigrateTs(libPath, dbType, dbProvider);
  createDrizzleConfig(libPath, dbProvider);

  // perhaps using push rather than migrate for sqlite?
  addScriptsToPackageJson(libPath, dbType);
  createDotEnv(databaseUrl);
  updateTsConfigTarget();

  const preferredPackageManager = (await select({
    message: "Please pick your preferred package manager",
    choices: [
      { name: "NPM", value: "npm" },
      { name: "Yarn", value: "yarn" },
      { name: "PNPM", value: "pnpm" },
    ],
  })) as PMType;
  // console.log("installing dependencies with", preferredPackageManager);
  createConfigFile({ driver: dbType, libPath, preferredPackageManager });

  installDependencies(dbProvider, preferredPackageManager);
}
