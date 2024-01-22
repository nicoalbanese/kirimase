import { confirm, select } from "@inquirer/prompts";
import { DBProvider, DBType, InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFolder,
  readConfigFile,
  updateConfigFile,
  wrapInParenthesis,
} from "../../../../utils.js";
import {
  addScriptsToPackageJson,
  addToDotEnv,
  createDotEnv,
  createDrizzleConfig,
  createIndexTs,
  createInitSchema,
  createMigrateTs,
  createQueriesAndMutationsFolders,
  installDependencies,
  updateTsConfigTarget,
} from "./generators.js";
import { addNanoidToUtils } from "./utils.js";

export const addDrizzle = async (
  dbType: DBType,
  dbProvider: DBProvider,
  includeExampleModel: boolean,
  initOptions?: InitOptions
) => {
  const { preferredPackageManager, hasSrc, rootPath } = readConfigFile();

  let libPath = "";
  hasSrc ? (libPath = "src/lib") : (libPath = "lib");

  let databaseUrl = "";

  if (dbType === "sqlite") {
    databaseUrl = "sqlite.db";
  } else if (dbType === "mysql") {
    databaseUrl = "mysql://root:root@localhost:3306/{DB_NAME}";
  } else {
    databaseUrl = "postgres://postgres:postgres@localhost:5432/{DB_NAME}";
  }

  if (dbProvider === "neon")
    databaseUrl = databaseUrl.concat("?sslmode=require");

  // create all the files here

  if (includeExampleModel) {
    createInitSchema(libPath, dbType);
    createQueriesAndMutationsFolders(libPath, dbType);
  } else {
    createFolder(`${hasSrc ? "src/" : ""}lib/db/schema`);
    createFolder(`${hasSrc ? "src/" : ""}lib/api`);
  }

  // dependent on dbtype and driver, create
  createIndexTs(dbProvider);
  createMigrateTs(libPath, dbType, dbProvider);
  createDrizzleConfig(libPath, dbProvider);

  // perhaps using push rather than migrate for sqlite?
  addScriptsToPackageJson(libPath, dbType, preferredPackageManager);
  createDotEnv(
    "drizzle",
    preferredPackageManager,
    databaseUrl,
    dbProvider === "planetscale",
    hasSrc ? "src/" : ""
  );
  if (dbProvider === "vercel-pg")
    addToDotEnv(
      [
        { key: "POSTGRES_URL", value: "" },
        { key: "POSTGRES_URL_NON_POOLING", value: "" },
        { key: "POSTGRES_USER", value: "" },
        { key: "POSTGRES_HOST", value: "" },
        { key: "POSTGRES_PASSWORD", value: "" },
        { key: "POSTGRES_DATABASE", value: "" },
      ],
      rootPath
    );
  if (dbProvider === "turso")
    addToDotEnv([{ key: "DATABASE_AUTH_TOKEN", value: "" }], rootPath);

  await updateTsConfigTarget();

  addNanoidToUtils();

  updateConfigFile({ driver: dbType, provider: dbProvider, orm: "drizzle" });
  await installDependencies(dbProvider, preferredPackageManager);
  addPackageToConfig("drizzle");
};
