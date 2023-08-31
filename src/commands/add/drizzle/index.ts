import { input, select } from "@inquirer/prompts";
import { DBProvider, DBType } from "../../../types.js";
import { DBProviders } from "../../init/utils.js";
import {
  addPackageToConfig,
  readConfigFile,
  updateConfigFile,
} from "../../../utils.js";
import {
  addScriptsToPackageJson,
  createDotEnv,
  createDrizzleConfig,
  createIndexTs,
  createInitSchema,
  createMigrateTs,
  createQueriesAndMutationsFolders,
  installDependencies,
  updateTsConfigTarget,
} from "./generators.js";

export const addDrizzle = async () => {
  const { preferredPackageManager, hasSrc } = readConfigFile();

  let libPath = "";
  hasSrc ? (libPath = "src/lib") : (libPath = "lib");

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
  createQueriesAndMutationsFolders(libPath);

  // dependent on dbtype and driver, create
  createIndexTs(libPath, dbType, dbProvider);
  createMigrateTs(libPath, dbType, dbProvider);
  createDrizzleConfig(libPath, dbProvider);

  // perhaps using push rather than migrate for sqlite?
  addScriptsToPackageJson(libPath, dbType);
  createDotEnv(databaseUrl);
  updateTsConfigTarget();

  updateConfigFile({ driver: dbType, provider: dbProvider });
  await installDependencies(dbProvider, preferredPackageManager);
  addPackageToConfig("drizzle");
};
