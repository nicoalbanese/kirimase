import { consola } from "consola";
import { createFile, createFolder, installPackages } from "../../utils.js";
import fs from "fs";
import path from "path";
import { DBType, PMType } from "../../types.js";

export const createDrizzleConfig = (libPath: string, driver: DBType) => {
  createFile(
    "drizzle.config.ts",
    `import type { Config } from "drizzle-kit";

export default {
  schema: "./${libPath}/db/schema",
  out: "./${libPath}/db/migrations",
  driver: "${driver}",
  //connection string
} satisfies Config;`
  );
};

export const createIndexTs = (libPath: string, dbType: DBType) => {
  switch (dbType) {
    case "pg":
      createFile(
        `${libPath}/db/index.ts`,
        `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);`
      );
      break;
    case "mysql":
      return ` not supported `;
    case "sqlite":
      return ` not supported `;
    default:
      break;
  }
};

export const createMigrateTs = (libPath: string, dbType: DBType) => {
  switch (dbType) {
    case "pg":
      createFile(
        `${libPath}/db/migrate.ts`,
        `import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const connection = postgres(process.env.DATABASE_URL, { max: 1 });

  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();

  await migrate(db, { migrationsFolder: '${libPath}/db/migrations' });

  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});`
      );
    case "mysql":
      return ` not supported `;
    case "sqlite":
      return ` not supported `;
    default:
      break;
  }
};

export const createInitSchema = (libPath: string, dbType: DBType) => {
  switch (dbType) {
    case "pg":
      // create db/schema folder
      // createFolder(`${libPath}/db/schema`);

      // create model in schema folder
      createFile(
        `./${libPath}/db/schema/user.ts`,
        `import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  password: text("password").notNull(),
});`
      );
  }
};

export const addScriptsToPackageJson = (libPath: string) => {
  // Define the path to package.json
  const packageJsonPath = path.resolve("package.json");

  // Read package.json
  const packageJsonData = fs.readFileSync(packageJsonPath, "utf-8");

  // Parse package.json content
  let packageJson = JSON.parse(packageJsonData);

  // Update the scripts property
  packageJson.scripts = {
    ...packageJson.scripts,
    migrate: `tsx ${libPath}/db/migrate.ts`,
    generate: "drizzle-kit generate:pg",
  };

  // Stringify the updated content
  const updatedPackageJsonData = JSON.stringify(packageJson, null, 2);

  // Write the updated content back to package.json
  fs.writeFileSync(packageJsonPath, updatedPackageJsonData);

  consola.success("Scripts added to package.json");
};

export const installDependencies = async (
  dbType: DBType,
  preferredPackageManager: PMType
) => {
  const packages = {
    pg: "postgres",
    mysql: "mysql2",
    sqlite: "better-sqlite3",
  };
  // note this change hasnt been tested yet
  const dbSpecificPackage = packages[dbType];
  if (dbSpecificPackage) {
    installPackages(
      {
        regular: `drizzle-orm drizzle-zod zod ${dbSpecificPackage}`,
        dev: "drizzle-kit tsx dotenv",
      },
      preferredPackageManager
    );
  }
};

export const createDotEnv = (databaseUrl?: string) => {
  const dburl =
    databaseUrl ?? "postgresql://postgres:postgres@localhost:5432/{DB_NAME}";

  createFile(".env", `DATABASE_URL=${dburl}`);
};

export function updateTsConfigTarget() {
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
    tsConfig.compilerOptions.target = "esnext";

    // Convert the modified object back to a JSON string
    const updatedContent = JSON.stringify(tsConfig, null, 2); // 2 spaces indentation

    // Write the updated content back to the file
    fs.writeFile(tsConfigPath, updatedContent, "utf8", (writeErr) => {
      if (writeErr) {
        console.error(
          `An error occurred while writing the updated tsconfig.json file: ${writeErr}`
        );
        return;
      }

      consola.info(
        "Updated tsconfig.json target to esnext to support Drizzle-Kit."
      );
    });
  });
}
