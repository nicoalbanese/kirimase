import { confirm, select } from "@inquirer/prompts";
import { DBType, InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  createFolder,
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
import { addToPrismaSchema } from "../../../generate/utils.js";
import { formatFilePath, getDbIndexPath } from "../../../filePaths/index.js";

export const addPrisma = async (initOptions?: InitOptions) => {
  const { preferredPackageManager, hasSrc } = readConfigFile();
  const dbIndex = getDbIndexPath("prisma");
  const rootPath = hasSrc ? "src/" : "";
  // ask for db type
  const dbType =
    initOptions?.db ||
    ((await select({
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
    })) as DBType);

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
    createDotEnv(
      "prisma",
      preferredPackageManager,
      generateDbUrl(dbType),
      true,
      hasSrc ? "src/" : ""
    );
  } else {
    // create prisma/schema.prisma (with db type)
    createFile(`prisma/schema.prisma`, generatePrismaSchema(dbType, false));
    createDotEnv(
      "prisma",
      preferredPackageManager,
      generateDbUrl(dbType),
      false,
      hasSrc ? "src/" : ""
    );
  }

  // create .env with database_url

  // generate prisma global instance
  createFile(
    formatFilePath(dbIndex, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generatePrismaDbInstance()
  );

  // update tsconfig with import alias for prisma types
  await updateTsConfigPrismaTypeAlias();

  const includeExampleModel =
    typeof initOptions?.includeExample === "string"
      ? initOptions.includeExample === "yes"
      : await confirm({
          message:
            "Would you like to include an example model? (suggested for new users)",
          default: true,
        });

  // create all the files here

  if (includeExampleModel) {
    addToPrismaSchema(
      `model Computer {
  id    String @id @default(cuid())
  brand String
  cores Int
}`,
      "Computer"
    );
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
  } else {
    createFolder(`${hasSrc ? "src/" : ""}lib/db/schema`);
    createFolder(`${hasSrc ? "src/" : ""}lib/api`);
  }

  // install packages: regular: [] dev: [prisma, zod-prisma]
  await installPackages(
    { regular: "zod @t3-oss/env-nextjs", dev: "prisma zod-prisma" },
    preferredPackageManager
  );

  // run prisma generate
  if (includeExampleModel) await prismaGenerate(preferredPackageManager);

  addPackageToConfig("prisma");
  updateConfigFile({ orm: "prisma", driver: dbType });

  consola.success("Prisma has been added to your project!");
};
