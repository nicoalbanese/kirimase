import { consola } from "consola";
import { DBType } from "../../../../types.js";
import { createFile, readConfigFile, runCommand } from "../../../../utils.js";
import { prismaFormat, prismaGenerate } from "../../../add/orm/utils.js";
import { Schema } from "../../types.js";
import { toCamelCase } from "../../utils.js";
import { generateMutationContent } from "./mutations/index.js";
import { generateQueryContent } from "./queries/index.js";
import { generateModelContent } from "./schema/index.js";
import { confirm } from "@inquirer/prompts";

export async function scaffoldModel(
  schema: Schema,
  dbType: DBType,
  hasSrc: boolean
) {
  const { tableName } = schema;
  const { orm, preferredPackageManager, driver } = readConfigFile();

  // create model file
  const modelPath = `${hasSrc ? "src/" : ""}lib/db/schema/${toCamelCase(
    tableName
  )}.ts`;
  createFile(modelPath, generateModelContent(schema, dbType));
  if (orm === "prisma") {
    await prismaFormat(preferredPackageManager);
    await prismaGenerate(preferredPackageManager);
  }

  // create queryFile
  const queryPath = `${hasSrc ? "src/" : ""}lib/api/${toCamelCase(
    tableName
  )}/queries.ts`;
  createFile(queryPath, generateQueryContent(schema, orm));

  // create mutationFile
  const mutationPath = `${hasSrc ? "src/" : ""}lib/api/${toCamelCase(
    tableName
  )}/mutations.ts`;
  createFile(mutationPath, generateMutationContent(schema, driver, orm));

  // migrate db
  // const migrate = await confirm({
  //   message: "Would you like to generate the migration and migrate the DB?",
  // });
  // if (!migrate) return;
  // if (orm === "drizzle") {
  //   await runCommand(preferredPackageManager, ["run", "db:generate"]);
  //   driver === "sqlite"
  //     ? await runCommand(preferredPackageManager, ["run", "db:push"])
  //     : await runCommand(preferredPackageManager, ["run", "db:migrate"]);
  // }
  // if (orm === "prisma") {
  //   driver === "sqlite"
  //     ? await runCommand(preferredPackageManager, [
  //         "run",
  //         "prisma",
  //         "db",
  //         "push",
  //       ])
  //     : await runCommand(preferredPackageManager, [
  //         "run",
  //         "prisma",
  //         "migrate",
  //         "dev",
  //       ]);
  // }
  // code from @elie22
  // const migrate = typeof buildOptions?.migrate === 'string' ?
  //   buildOptions?.migrate === 'yes' :
  //   await confirm({
  //     message: "Would you like to generate the migration and migrate the DB?",
  //   });
  // if (!migrate) return;
  // if (orm === "drizzle") {
  //   await runCommand(preferredPackageManager, ["run", "db:generate"]);
  //   driver === "sqlite"
  //     ? await runCommand(preferredPackageManager, ["run", "db:push"])
  //     : await runCommand(preferredPackageManager, ["run", "db:migrate"]);
  // }
  // if (orm === "prisma") {
  //   driver === "sqlite"
  //     ? await runCommand(preferredPackageManager, [
  //         "run",
  //         "prisma",
  //         "db",
  //         "push",
  //       ])
  //     : await runCommand(preferredPackageManager, [
  //         "run",
  //         "prisma",
  //         "migrate",
  //         "dev",
  //       ]);
  // }
  consola.success("Successfully added model to your database!");
}
