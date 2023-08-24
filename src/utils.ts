import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { consola } from "consola";
import { Config, PMType } from "./types.js";

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createFile(filePath: string, content: string) {
  const resolvedPath = path.resolve(filePath);
  const dirName = path.dirname(resolvedPath);

  // Check if the directory exists
  if (!fs.existsSync(dirName)) {
    // If not, create the directory and any nested directories that might be needed
    fs.mkdirSync(dirName, { recursive: true });
    consola.success(`Directory ${dirName} created.`);
  }

  fs.writeFileSync(resolvedPath, content);
  consola.success(`File created at ${filePath}`);
}

export function replaceFile(filePath: string, content: string) {
  const resolvedPath = path.resolve(filePath);
  const dirName = path.dirname(resolvedPath);

  // Check if the directory exists
  if (!fs.existsSync(dirName)) {
    // If not, create the directory and any nested directories that might be needed
    fs.mkdirSync(dirName, { recursive: true });
    consola.success(`Directory ${dirName} created.`);
  }

  fs.writeFileSync(resolvedPath, content);
  consola.success(`File replaced at ${filePath}`);
}

export function createFolder(relativePath: string) {
  const fullPath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(fullPath, { recursive: true });
  consola.success(`Folder created at ${fullPath}`);
}

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

export const createConfigFile = (options: Config) => {
  createFile("./kirimase.json", JSON.stringify(options));
};

export const readConfigFile = () => {
  // Define the path to package.json
  const configPath = path.join(process.cwd(), "kirimase.json");

  // Read package.json
  const configJsonData = fs.readFileSync(configPath, "utf-8");

  // Parse package.json content
  let config = JSON.parse(configJsonData);

  // Update the scripts property
  return config;
};

export const wrapInParenthesis = (string: string) => {
  return "(" + string + ")";
};
