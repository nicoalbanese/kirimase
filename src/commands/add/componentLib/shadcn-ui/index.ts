import { consola } from "consola";
// import { execa } from "execa";
import { existsSync } from "fs";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  installShadcnUIComponents,
  // pmInstallCommand,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { AvailablePackage, PMType } from "../../../../types.js";
import { addContextProviderToLayout } from "../../utils.js";
import { shadcnGenerators } from "./generators.js";
import { generateLoadingPage } from "../../auth/lucia/generators.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

const manualInstallShadCn = async (
  preferredPackageManager: PMType,
  rootPath: string
) => {
  const {
    generateComponentsJson,
    generateGlobalsCss,
    generateLibUtilsTs,
    generateTailwindConfig,
    generateThemeProvider,
    generateThemeToggler,
  } = shadcnGenerators;
  const { shared } = getFilePaths();
  // add deps (tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react)
  await installPackages(
    {
      dev: "",
      regular:
        "tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react next-themes",
    },
    preferredPackageManager
  );
  // add tailwind.config.js
  createFile("tailwind.config.js", generateTailwindConfig(rootPath));
  // update globals.css
  replaceFile(
    formatFilePath(shared.init.globalCss, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateGlobalsCss()
  );
  // add cn helper (lib/utils.ts)
  createFile(rootPath.concat("lib/utils.ts"), generateLibUtilsTs());
  // create components.json
  createFile("components.json", generateComponentsJson(rootPath));

  createFile(rootPath.concat("app/loading.tsx"), generateLoadingPage());

  // todo: install theme switcher
  // create theme provider
  createFile(
    rootPath.concat("components/ThemeProvider.tsx"),
    generateThemeProvider()
  );
  //generate theme toggler
  createFile(
    rootPath.concat("components/ui/ThemeToggle.tsx"),
    generateThemeToggler()
  );
  // add context provider to layout
  addContextProviderToLayout("ThemeProvider");
};

export const installShadcnUI = async (
  packagesBeingInstalled: AvailablePackage[]
) => {
  const {
    packages: installedPackages,
    preferredPackageManager,
    rootPath,
  } = readConfigFile();
  const packages = packagesBeingInstalled.concat(installedPackages);
  consola.start("Installing Shadcn UI...");
  const filePath = "components.json";

  // const baseArgs = ["shadcn-ui@latest", "init"];
  // const installArgs =
  //   preferredPackageManager === "pnpm" ? ["dlx", ...baseArgs] : baseArgs;

  if (existsSync(filePath)) {
    consola.info("Shadcn is already installed. Adding Shadcn UI to config...");
    addPackageToConfig("shadcn-ui");
    updateConfigFile({ componentLib: "shadcn-ui" });
  } else {
    try {
      // await execa(pmInstallCommand[preferredPackageManager], installArgs, {
      //   stdio: "inherit",
      // });
      await manualInstallShadCn(preferredPackageManager, rootPath);
      consola.success("Shadcn initialized successfully.");
      addPackageToConfig("shadcn-ui");
      updateConfigFile({ componentLib: "shadcn-ui" });
    } catch (error) {
      consola.error(`Failed to initialize Shadcn: ${error.message}`);
    }
  }
  await installShadcnUIComponents([
    "button",
    "toast",
    "avatar",
    "dropdown-menu",
    "input",
    "label",
  ]);
  addContextProviderToLayout("ShadcnToast");

  // if (packages.includes("next-auth")) updateSignInComponentWithShadcnUI();
};

export const updateSignInComponentWithShadcnUI = () => {
  const { hasSrc, alias } = readConfigFile();
  const filepath = "components/auth/SignIn.tsx";
  const updatedContent = `"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "${alias}/components/ui/button";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <Button variant={"destructive"} onClick={() => signOut()}>Sign out</Button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <Button onClick={() => signIn()}>Sign in</Button>
    </>
  );
}`;
  replaceFile(`${hasSrc ? "src/" : ""}${filepath}`, updatedContent);
};
