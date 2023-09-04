import { consola } from "consola";
import { execa } from "execa";
import { existsSync } from "fs";
import {
  addPackageToConfig,
  pmInstallCommand,
  readConfigFile,
} from "../../../utils.js";

export const installShadcnUI = async () => {
  consola.start("Installing Shadcn UI...");
  const { preferredPackageManager } = readConfigFile();
  const filePath = "components.json";

  const baseArgs = ["shadcn-ui@latest", "init"];
  const installArgs =
    preferredPackageManager === "pnpm" ? ["dlx", ...baseArgs] : baseArgs;

  if (existsSync(filePath)) {
    consola.info("Shadcn is already installed. Adding Shadcn UI to config...");
    addPackageToConfig("shadcn-ui");
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
