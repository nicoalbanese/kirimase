import fs from "fs";
import path from "path";
// import { exec } from "child_process";
import { consola } from "consola";
import { AvailablePackage, Config, PMType, UpdateConfig } from "./types.js";
import { promisify } from "util";
import { exec as execCb, spawn } from "child_process";

const exec = promisify(execCb);

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

// export async function installPackages(
//   packages: { regular: string; dev: string },
//   pmType: PMType
// ) {
//   const packagesListString = packages.regular.concat(" ").concat(packages.dev);
//   consola.start(`Installing packages: ${packagesListString}...`);
//
//   try {
//     if (packages.dev) {
//       const devStdout = await exec(`${pmType} install -D ${packages.dev}`);
//       if (devStdout) consola.info(devStdout.stdout);
//     }
//
//     if (packages.regular) {
//       const regularStdout = await exec(`${pmType} install ${packages.regular}`);
//       if (regularStdout) consola.info(regularStdout.stdout);
//     }
//
//     consola.success(`Packages installed: ${packagesListString}`);
//   } catch (error) {
//     consola.error(`An error occurred: ${error}`);
//   }
// }

export async function installPackages(
  packages: { regular: string; dev: string },
  pmType: PMType
) {
  const packagesListString = packages.regular.concat(" ").concat(packages.dev);
  consola.start(`Installing packages: ${packagesListString}...`);

  const runCommand = (command: string, args: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cmd = spawn(command, args, { stdio: "inherit" });

      cmd.on("close", (code: number) => {
        if (code !== 0) {
          reject(
            new Error(
              `command "${command} ${args.join(" ")}" exited with code ${code}`
            )
          );
        } else {
          resolve();
        }
      });
    });
  };

  try {
    if (packages.dev) {
      await runCommand(
        pmType,
        ["install", "-D"].concat(packages.dev.split(" "))
      );
    }

    if (packages.regular) {
      await runCommand(pmType, ["install"].concat(packages.regular.split(" ")));
    }

    consola.success(`Packages installed: ${packagesListString}`);
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}

export const createConfigFile = (options: Config) => {
  createFile("./kirimase.config.json", JSON.stringify(options, null, 2));
};

export const updateConfigFile = (options: UpdateConfig) => {
  const config = readConfigFile();
  const newConfig = { ...config, ...options };
  createFile("./kirimase.config.json", JSON.stringify(newConfig, null, 2));
};

export const readConfigFile = (): Config | null => {
  // Define the path to package.json
  const configPath = path.join(process.cwd(), "kirimase.config.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }
  // Read package.json
  const configJsonData = fs.readFileSync(configPath, "utf-8");

  // Parse package.json content
  let config: Config = JSON.parse(configJsonData);

  // Update the scripts property
  return config as Config;
};

export const addPackageToConfig = (packageName: AvailablePackage) => {
  const config = readConfigFile();
  updateConfigFile({ packages: [...config?.packages, packageName] });
};

export const wrapInParenthesis = (string: string) => {
  return "(" + string + ")";
};

// export async function installPackages(
//   packages: { regular: string; dev: string },
//   pmType: PMType
// ) {
//   const packagesListString = packages.regular.concat(" ").concat(packages.dev);
//   consola.start(`Installing packages: ${packagesListString}...`);
//
//   exec(
//     `${pmType} install -D ${packages.dev}
// ${pmType} install ${packages.regular}`,
//     (error, stdout, stderr) => {
//       if (error) {
//         console.error(`An error occurred: ${error}`);
//         return;
//       }
//
//       if (stdout) consola.info(stdout);
//       if (stderr) consola.error(stderr);
//
//       consola.success(`Packages installed: ${packagesListString}`);
//     }
//   );
// }
