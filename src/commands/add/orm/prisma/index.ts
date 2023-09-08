import { confirm, select } from "@inquirer/prompts";
import { DBType } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
  updateConfigFile,
} from "../../../../utils.js";
import {
  generatePrismaComputerModel,
  generatePrismaComputerMutations,
  generatePrismaComputerQueries,
  generatePrismaDbInstance,
  generatePrismaSchema,
} from "./generators.js";
import { createDotEnv } from "../drizzle/generators.js";
import {
  generateDbUrl,
  prismaGenerate,
  updateTsConfigPrismaTypeAlias,
} from "../utils.js";
import { consola } from "consola";

export const addPrisma = async () => {
  const { preferredPackageManager, hasSrc } = readConfigFile();
  const rootPath = hasSrc ? "src/" : "";
  // ask for db type
  const dbType = (await select({
    message: "Please choose your DB type",
    choices: [
      { name: "Postgres", value: "pg" },
      {
        name: "MySQL",
        value: "mysql",
      },
      {
        name: "SQLite",
        value: "sqlite",
      },
    ],
  })) as DBType;

  // if mysql, ask if planetscale
  if (dbType === "mysql") {
    const usingPlanetscale = await confirm({
      message: "Are you using PlanetScale?",
      default: false,
    });
    // scaffold planetscale specific schema
    createFile(
      `prisma/schema.prisma`,
      generatePrismaSchema(dbType, usingPlanetscale)
    );
    updateConfigFile({ provider: "planetscale" });
  } else {
    // create prisma/schema.prisma (with db type)
    createFile(`prisma/schema.prisma`, generatePrismaSchema(dbType, false));
  }

  // create .env with database_url
  createDotEnv(generateDbUrl(dbType));

  // generate prisma global instance
  createFile(`${rootPath}lib/db/index.ts`, generatePrismaDbInstance());

  // update tsconfig with import alias for prisma types
  updateTsConfigPrismaTypeAlias();

  // generate /lib/db/schema/computers.ts
  createFile(
    `${rootPath}lib/db/schema/computers.ts`,
    generatePrismaComputerModel()
  );

  // generate /lib/api/computers/queries.ts && /lib/api/computers/mutations.ts
  createFile(
    `${rootPath}lib/api/computers/queries.ts`,
    generatePrismaComputerQueries()
  );
  createFile(
    `${rootPath}lib/api/computers/mutations.ts`,
    generatePrismaComputerMutations()
  );

  // install packages: regular: [] dev: [prisma, zod-prisma]
  await installPackages(
    { regular: "zod", dev: "prisma zod-prisma" },
    preferredPackageManager
  );

  // run prisma generate
  await prismaGenerate(preferredPackageManager);
  addPackageToConfig("prisma");
  updateConfigFile({ orm: "prisma", driver: dbType });

  consola.success("Prisma has been added to your project!");
};
