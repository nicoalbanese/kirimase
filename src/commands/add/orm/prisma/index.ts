import { DBType, InitOptions } from "../../../../types.js";
import {
  addPackageToConfig,
  createFile,
  createFolder,
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
import { addToPrismaSchema } from "../../../generate/utils.js";
import { formatFilePath, getDbIndexPath } from "../../../filePaths/index.js";
import { addToInstallList } from "../../utils.js";
import { addScriptsToPackageJsonForPrisma } from "./utils.js";

export const addPrisma = async (
  includeExampleModel: boolean,
  dbType: DBType,
  initOptions?: InitOptions
) => {
  const { preferredPackageManager, hasSrc } = readConfigFile();
  const dbIndex = getDbIndexPath("prisma");
  const rootPath = hasSrc ? "src/" : "";
  // ask for db type

  // if mysql, ask if planetscale
  if (dbType === "mysql") {
    // scaffold planetscale specific schema
    await createFile(
      `prisma/schema.prisma`,
      await generatePrismaSchema(
        dbType,
        initOptions.dbProvider === "planetscale"
      )
    );
    await updateConfigFile({ provider: "planetscale" });
    await createDotEnv(
      "prisma",
      preferredPackageManager,
      generateDbUrl(dbType),
      true,
      hasSrc ? "src/" : ""
    );
  } else {
    // create prisma/schema.prisma (with db type)
    await createFile(
      `prisma/schema.prisma`,
      await generatePrismaSchema(dbType, false)
    );
    await createDotEnv(
      "prisma",
      preferredPackageManager,
      generateDbUrl(dbType),
      false,
      hasSrc ? "src/" : ""
    );
  }

  // create .env with database_url

  // generate prisma global instance
  await createFile(
    formatFilePath(dbIndex, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generatePrismaDbInstance()
  );

  // update tsconfig with import alias for prisma types
  await updateTsConfigPrismaTypeAlias();

  // create all the files here

  if (includeExampleModel) {
    await addToPrismaSchema(
      `model Computer {
  id    String @id @default(cuid())
  brand String
  cores Int
}`,
      "Computer"
    );
    // generate /lib/db/schema/computers.ts
    await createFile(
      `${rootPath}lib/db/schema/computers.ts`,
      generatePrismaComputerModel()
    );

    // generate /lib/api/computers/queries.ts && /lib/api/computers/mutations.ts
    await createFile(
      `${rootPath}lib/api/computers/queries.ts`,
      generatePrismaComputerQueries()
    );
    await createFile(
      `${rootPath}lib/api/computers/mutations.ts`,
      generatePrismaComputerMutations()
    );
  } else {
    createFolder(`${hasSrc ? "src/" : ""}lib/db/schema`);
    createFolder(`${hasSrc ? "src/" : ""}lib/api`);
  }

  await addScriptsToPackageJsonForPrisma(dbType);

  // install packages: regular: [] dev: [prisma, zod-prisma]
  // await installPackages(
  //   { regular: "zod @t3-oss/env-nextjs", dev: "prisma zod-prisma" },
  //   preferredPackageManager,
  // );
  addToInstallList({
    regular: ["zod", "@t3-oss/env-nextjs"],
    dev: ["prisma", "zod-prisma"],
  });

  // run prisma generate
  if (includeExampleModel) await prismaGenerate(preferredPackageManager);

  await addPackageToConfig("prisma");
  await updateConfigFile({ orm: "prisma", driver: dbType });

  // consola.success("Prisma has been added to your project!");
};
