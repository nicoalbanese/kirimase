import fs, { existsSync } from "fs";
import path, { join } from "path";
import { consola } from "consola";
import { AvailablePackage, Config, PMType, UpdateConfig } from "./types.js";
import { spawn } from "child_process";
import { execa } from "execa";

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createFile(filePath: string, content: string) {
  const resolvedPath = path.resolve(filePath);
  const dirName = path.dirname(resolvedPath);

  // Check if the directory exists
  if (!fs.existsSync(dirName)) {
    // If not, create the directory and any nested directories that might be needed
    fs.mkdirSync(dirName, { recursive: true });
    // consola.success(`Directory ${dirName} created.`);
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
//   const runCommand = (command: string, args: string[]): Promise<void> => {
//     return new Promise((resolve, reject) => {
//       const cmd = spawn(command, args, { stdio: "inherit" });
//
//       cmd.on("close", (code: number) => {
//         if (code !== 0) {
//           reject(
//             new Error(
//               `command "${command} ${args.join(" ")}" exited with code ${code}`
//             )
//           );
//         } else {
//           resolve();
//         }
//       });
//     });
//   };
//
//   try {
//     if (packages.dev) {
//       await runCommand(
//         pmType,
//         ["install", "-D"].concat(packages.dev.split(" "))
//       );
//     }
//
//     if (packages.regular) {
//       await runCommand(pmType, ["install"].concat(packages.regular.split(" ")));
//     }
//
//     consola.success(`Packages installed: ${packagesListString}`);
//   } catch (error) {
//     console.error(`An error occurred: ${error.message}`);
//   }
// }

export const runCommand = async (command: string, args: string[]) => {
  const formattedArgs = args.filter((a) => a !== "");
  try {
    await execa(command, formattedArgs, { stdio: "inherit" });
  } catch (error) {
    throw new Error(
      `command "${command} ${formattedArgs
        .join(" ")
        .trim()}" exited with code ${error.code}`
    );
  }
};

export async function installPackages(
  packages: { regular: string; dev: string },
  pmType: PMType
) {
  const packagesListString = packages.regular.concat(" ").concat(packages.dev);
  consola.start(`Installing packages: ${packagesListString}...`);

  const installCommand = pmType === "npm" ? "install" : "add";

  try {
    if (packages.dev) {
      await runCommand(
        pmType,
        [installCommand, "-D"].concat(packages.dev.split(" "))
      );
    }

    if (packages.regular) {
      await runCommand(
        pmType,
        [installCommand].concat(packages.regular.split(" "))
      );
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
  replaceFile("./kirimase.config.json", JSON.stringify(newConfig, null, 2));
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

// shadcn specific utils

export const pmInstallCommand = {
  pnpm: "pnpm",
  npm: "npx",
  yarn: "npx",
  // bun: "bunx",
};

export async function installShadcnUIComponents(
  components: string[]
): Promise<void> {
  const { preferredPackageManager, hasSrc } = readConfigFile();
  const componentsToInstall: string[] = [];

  for (const component of components) {
    const tsxFilePath = path.resolve(
      `${hasSrc ? "src/" : ""}components/ui/${component}.tsx`
    );

    if (!existsSync(tsxFilePath)) {
      componentsToInstall.push(component);
    }
  }
  const baseArgs = ["shadcn-ui@latest", "add", ...componentsToInstall];
  const installArgs =
    preferredPackageManager === "pnpm" ? ["dlx", ...baseArgs] : baseArgs;

  if (componentsToInstall.length > 0) {
    consola.start(
      `Installing shadcn-ui components: ${componentsToInstall.join(", ")}`
    );
    try {
      await execa(pmInstallCommand[preferredPackageManager], installArgs, {
        stdio: "inherit",
      });
      consola.success(
        `Installed components: ${componentsToInstall.join(", ")}`
      );
    } catch (error) {
      consola.error(`Failed to install components: ${error.message}`);
    }
  } else {
    consola.info("All items already installed.");
  }
}

export const getFileContents = (filePath: string) => {
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return fileContents;
};
