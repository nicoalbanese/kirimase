import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { consola } from "consola";

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createFile(filePath: string, content: string) {
  fs.writeFileSync(path.resolve(filePath), content);
  consola.success(`File created at ${filePath}`);
}

export function createFolder(relativePath: string) {
  const fullPath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(fullPath, { recursive: true });
  consola.success(`Folder created at ${fullPath}`);
}

export type DBType = "pg" | "mysql" | "sqlite";
export type PMType = "npm" | "yarn" | "pnpm";
export type DBField = { name: string; type: string };

export function installPackages(
  packages: { regular: string; dev: string },
  pmType: PMType
) {
  const packagesListString = packages.regular.concat(" ").concat(packages.dev);
  consola.start(`Installing packages: ${packagesListString}...`);

  exec(
    `${pmType} install -D ${packages.dev}
${pmType} install ${packages.regular}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`An error occurred: ${error}`);
        return;
      }

      if (stdout) consola.info(stdout);
      if (stderr) consola.error(stderr);

      consola.success(`Packages installed: ${packagesListString}`);
    }
  );
}
