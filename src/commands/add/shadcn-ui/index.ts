import { consola } from "consola";
import { execa } from "execa";
import { existsSync } from "fs";
import {
  addPackageToConfig,
  pmInstallCommand,
  readConfigFile,
} from "../../../utils.js";

export const installShadcnUI = async () => {
  const { preferredPackageManager } = readConfigFile();
  const filePath = "components.json";

  const baseArgs = ["shadcn-ui@latest", "init"];
  const installArgs =
    preferredPackageManager === "pnpm" ? ["dlx", ...baseArgs] : baseArgs;

  if (existsSync(filePath)) {
    consola.log("Shadcn is already installed.");
  } else {
    try {
      await execa(pmInstallCommand[preferredPackageManager], installArgs, {
        stdio: "inherit",
      });
      consola.success("Shadcn initialized successfully.");
      addPackageToConfig("shadcn-ui");
    } catch (error) {
      consola.error(`Failed to initialize Shadcn: ${error.message}`);
    }
  }
};
