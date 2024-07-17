import path from "path";
import fs from "fs";
import { DBType } from "../../../../types.js";
import { formatFileContentWithPrettier } from "../../../init/utils.js";

export const prismaDbTypeMappings: { [key in DBType]: string } = {
  pg: "postgresql",
  mysql: "mysql",
  sqlite: "sqlite",
};

export const addScriptsToPackageJsonForPrisma = async (driver: DBType) => {
  // Define the path to package.json
  const packageJsonPath = path.resolve("package.json");

  // Read package.json
  const packageJsonData = fs.readFileSync(packageJsonPath, "utf-8");

  // Parse package.json content
  let packageJson = JSON.parse(packageJsonData);

  const newItems = {
    dev: "prisma generate && next dev",
    build: "prisma generate && next build",
    "db:generate": `prisma generate`,
    "db:migrate": `prisma migrate dev`,
    ...(driver !== "pg" ? { "db:push": `prisma db push` } : {}),
    "db:studio": "prisma studio",
  };
  packageJson.scripts = {
    ...packageJson.scripts,
    ...newItems,
  };

  // Stringify the updated content
  const updatedPackageJsonData = JSON.stringify(packageJson, null, 2);

  // Write the updated content back to package.json
  fs.writeFileSync(
    packageJsonPath,
    await formatFileContentWithPrettier(updatedPackageJsonData, packageJsonPath)
  );

  // consola.success("Scripts added to package.json");
};
