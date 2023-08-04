import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createFile(filePath: string, content: string) {
  fs.writeFileSync(path.resolve(filePath), content);
  console.log(`File created at ${filePath}`);
}

export function createFolder(relativePath: string) {
  const fullPath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`Folder created at ${fullPath}`);
}

export type DBType = "pg" | "mysql" | "sqlite";
export type PMType = "npm" | "yarn" | "pnpm";

export function installPackages(
  packages: { regular: string; dev: string },
  pmType: PMType
) {
  const packagesListString = packages.regular.concat(" ").concat(packages.dev);
  console.log(`Installing packages: ${packagesListString}...`);

  exec(
    `${pmType} install -D ${packages.dev}
${pmType} install ${packages.regular}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`An error occurred: ${error}`);
        return;
      }

      console.log(stdout);
      console.error(stderr);

      console.log(`Packages installed: ${packagesListString}`);
    }
  );
}
