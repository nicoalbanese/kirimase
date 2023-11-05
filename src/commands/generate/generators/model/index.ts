import { consola } from "consola";
import { DBType } from "../../../../types.js";
import { createFile, readConfigFile, replaceFile } from "../../../../utils.js";
import { prismaFormat, prismaGenerate } from "../../../add/orm/utils.js";
import { Schema } from "../../types.js";
import { toCamelCase } from "../../utils.js";
import { generateMutationContent } from "./mutations/index.js";
import { generateQueryContent } from "./queries/index.js";
import { generateModelContent } from "./schema/index.js";
import {
  formatFilePath,
  generateServiceFileNames,
  getFilePaths,
} from "../../../filePaths/index.js";
import { existsSync, readFileSync } from "fs";

export async function scaffoldModel(
  schema: Schema,
  dbType: DBType,
  hasSrc: boolean
) {
  const { tableName } = schema;
  const { orm, preferredPackageManager, driver, t3 } = readConfigFile();
  const { shared, drizzle } = getFilePaths();
  const serviceFileNames = generateServiceFileNames(toCamelCase(tableName));

  const modelPath = `${formatFilePath(shared.orm.schemaDir, {
    prefix: "rootPath",
    removeExtension: false,
  })}/${toCamelCase(tableName)}.ts`;
  createFile(modelPath, generateModelContent(schema, dbType));

  if (t3) {
    updateRootSchema(tableName);
  }

  if (orm === "prisma") {
    await prismaFormat(preferredPackageManager);
    await prismaGenerate(preferredPackageManager);
  }

  // create queryFile
  createFile(serviceFileNames.queriesPath, generateQueryContent(schema, orm));

  // create mutationFile
  createFile(
    serviceFileNames.mutationsPath,
    generateMutationContent(schema, driver, orm)
  );

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

const updateRootSchema = (tableName: string) => {
  const tableNameCC = toCamelCase(tableName);
  const { drizzle } = getFilePaths();
  const rootSchemaPath = formatFilePath(drizzle.schemaAggregator, {
    prefix: "rootPath",
    removeExtension: false,
  });
  // check if schema/_root.ts exists
  const rootSchemaExists = existsSync(rootSchemaPath);
  if (rootSchemaExists) {
    // if yes, import new model from model path and add to export -> perhaps replace 'export {' with 'export { new_model,'
    const rootSchemaContents = readFileSync(rootSchemaPath, "utf-8");
    const rootSchemaWithNewExport = rootSchemaContents.replace(
      "export {",
      `export { ${tableNameCC}, `
    );

    const importInsertionPoint = rootSchemaWithNewExport.lastIndexOf("import");
    const nextLineAfterLastImport =
      rootSchemaWithNewExport.indexOf("\n", importInsertionPoint) + 1;
    const beforeImport = rootSchemaWithNewExport.slice(
      0,
      nextLineAfterLastImport
    );
    const afterImport = rootSchemaWithNewExport.slice(nextLineAfterLastImport);
    const newImportStatement = `import { ${tableNameCC} } from "./${tableNameCC}";\n`;
    const withNewImport = `${beforeImport}${newImportStatement}${afterImport}`;
    replaceFile(rootSchemaPath, withNewImport);
  } else {
    // if not create schema/_root.ts -> then do same import as above
    createFile(
      rootSchemaPath,
      `import {${tableNameCC}} from "./${tableNameCC}"

export { ${tableNameCC} }`
    );
    // and also update db/index.ts to add extended model import
    const indexDbPath = formatFilePath(drizzle.dbIndex, {
      removeExtension: false,
      prefix: "rootPath",
    });
    const indexDbContents = readFileSync(indexDbPath, "utf-8");
    const updatedContentsWithImport = indexDbContents.replace(
      `import * as schema from "./schema";`,
      `import * as schema from "./schema";
import * as extended from "~/server/db/schema/_root";`
    );
    const updatedContentsFinal = updatedContentsWithImport.replace(
      `{ schema }`,
      `{ schema: { ...schema, ...extended } }`
    );
    replaceFile(indexDbPath, updatedContentsFinal);

    // update drizzle config file to add all in server/db/*
    const drizzleConfigPath = "drizzle.config.ts";
    const dConfigContents = readFileSync(drizzleConfigPath, "utf-8");
    const updatedContents = dConfigContents.replace(
      `schema: "./src/server/db/schema.ts",`,
      `schema: "./src/server/db/*",`
    );
    replaceFile(drizzleConfigPath, updatedContents);
  }
};
