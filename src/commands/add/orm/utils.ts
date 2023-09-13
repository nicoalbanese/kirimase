import { consola } from "consola";
import { DBProvider, DBType, PMType } from "../../../types.js";
import { pmInstallCommand } from "../../../utils.js";
import { execa } from "execa";
import fs from "fs";
import path from "path";

export const generateDbUrl = (dbType: DBType, provider?: DBProvider) => {
  let databaseUrl = "";

  if (dbType === "sqlite") {
    databaseUrl = "sqlite.db";
  } else if (dbType === "mysql") {
    databaseUrl = "mysql://root:root@localhost:3306/{DB_NAME}";
  } else {
    databaseUrl = "postgres://postgres:postgres@localhost:5432/{DB_NAME}";
  }

  if (provider !== null && provider === "neon")
    databaseUrl = databaseUrl.concat("?sslmode=require");
  return databaseUrl;
};

export const prismaGenerate = async (packageManager: PMType) => {
  consola.start(
    `Running Prisma generate command to generate zod-prisma types.`
  );
  try {
    await execa(pmInstallCommand[packageManager], ["prisma", "generate"], {
      stdio: "inherit",
    });
    consola.success(`Successfully generated zod-prisma types`);
  } catch (error) {
    consola.error(`Failed to run Prisma generate: ${error.message}`);
  }
};

export const prismaFormat = async (packageManager: PMType) => {
  // consola.start(`Running Prisma format.`);
  try {
    await execa(pmInstallCommand[packageManager], ["prisma", "format"], {
      stdio: "inherit",
    });
  } catch (error) {
    consola.error(`Failed to run Prisma format: ${error.message}`);
  }
};

export function updateTsConfigPrismaTypeAlias() {
  // Define the path to the tsconfig.json file
  const tsConfigPath = path.join(process.cwd(), "tsconfig.json");

  // Read the file
  fs.readFile(tsConfigPath, "utf8", (err, data) => {
    if (err) {
      console.error(
        `An error occurred while reading the tsconfig.json file: ${err}`
      );
      return;
    }

    // Parse the content as JSON
    const tsConfig = JSON.parse(data);

    // Modify the target property
    tsConfig.compilerOptions.paths["@/zodAutoGenSchemas"] = [
      "./prisma/zod/index",
    ];

    tsConfig.compilerOptions.baseUrl = "./";

    // Convert the modified object back to a JSON string
    const updatedContent = JSON.stringify(tsConfig, null, 2); // 2 spaces indentation

    // Write the updated content back to the file
    fs.writeFile(tsConfigPath, updatedContent, "utf8", (writeErr) => {
      if (writeErr) {
        consola.error(
          `An error occurred while writing the updated tsconfig.json file: ${writeErr}`
        );
        return;
      }

      consola.success(
        "Updated tsconfig.json to support zod-prisma type alias."
      );
    });
  });
}
