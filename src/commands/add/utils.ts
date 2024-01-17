import { consola } from "consola";
import {
  AuthSubType,
  AuthType,
  AvailablePackage,
  PackageType,
} from "../../types.js";
import {
  installPackages,
  installShadcnUIComponents,
  readConfigFile,
  replaceFile,
} from "../../utils.js";
import fs from "fs";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { spinner } from "./index.js";

export const Packages: {
  [key in PackageType]: {
    name: string;
    value: AvailablePackage;
    disabled?: boolean;
  }[];
} = {
  orm: [
    { name: "Drizzle", value: "drizzle" },
    { name: "Prisma", value: "prisma" },
  ],
  auth: [
    { name: "Auth.js (NextAuth)", value: "next-auth" },
    { name: "Clerk", value: "clerk" },
    { name: "Lucia", value: "lucia" },
    { name: "Kinde", value: "kinde" },
  ],
  misc: [
    { name: "TRPC", value: "trpc" },
    { name: "Stripe", value: "stripe" },
    { name: "Resend", value: "resend" },
  ],
  componentLib: [{ name: "Shadcn UI (with next-themes)", value: "shadcn-ui" }],
};

export const addContextProviderToLayout = (
  provider:
    | "NextAuthProvider"
    | "TrpcProvider"
    | "ShadcnToast"
    | "ClerkProvider"
    | "Navbar"
    | "ThemeProvider"
) => {
  const { hasSrc, alias } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/layout.tsx`;

  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);

  const { trpc, "next-auth": nextAuth, shared } = getFilePaths();

  let importStatement: string;
  switch (provider) {
    case "NextAuthProvider":
      importStatement = `import NextAuthProvider from "${formatFilePath(
        nextAuth.authProviderComponent,
        { prefix: "alias", removeExtension: true }
      )}";`;
      break;
    case "TrpcProvider":
      importStatement = `import TrpcProvider from "${formatFilePath(
        trpc.trpcProvider,
        { removeExtension: true, prefix: "alias" }
      )}";\nimport { cookies } from "next/headers";`;
      break;
    case "ShadcnToast":
      importStatement = `import { Toaster } from "${alias}/components/ui/toaster";`;
      break;
    case "ClerkProvider":
      importStatement = 'import { ClerkProvider } from "@clerk/nextjs";';
      break;
    case "Navbar":
      importStatement = `import Navbar from "${formatFilePath(
        shared.init.navbarComponent,
        { prefix: "alias", removeExtension: true }
      )}";\nimport Sidebar from "${formatFilePath(
        shared.init.sidebarComponent,
        { prefix: "alias", removeExtension: true }
      )}";`;
      break;
    case "ThemeProvider":
      importStatement = `import { ThemeProvider } from "${alias}/components/ThemeProvider";`;
      break;
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    // consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const navbarExists = fileContent.includes("<Navbar />");
  const rootChildrenText = !navbarExists
    ? "{children}"
    : `<div className="flex">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8">\n<Navbar />\n{children}\n</main>\n</div>`;
  let replacementText = "";
  switch (provider) {
    case "ShadcnToast":
      replacementText = `${rootChildrenText}\n<Toaster />\n`;
      break;
    case "Navbar":
      replacementText = `<div className="flex">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8">\n<Navbar />\n{children}\n</main>\n</div>`;
      break;
    case "ThemeProvider":
      replacementText = `\n<${provider} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>${rootChildrenText}</${provider}>\n`;
      break;
    case "TrpcProvider":
      replacementText = `\n<${provider} cookies={cookies().toString()}>${rootChildrenText}</${provider}>\n`;
      break;
    default:
      replacementText = `\n<${provider}>${rootChildrenText}</${provider}>\n`;
      break;
  }

  const searchValue = !navbarExists
    ? "{children}"
    : `<div className="flex">\n<Sidebar />\n<main className="flex-1 md:p-8 pt-2 p-8">\n<Navbar />\n{children}\n</main>\n</div>`;
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText
  );
  replaceFile(path, newLayoutContent);
};

export const AuthSubTypeMapping: Record<AuthType, AuthSubType> = {
  clerk: "managed",
  kinde: "managed",
  "next-auth": "self-hosted",
  lucia: "managed",
};

const installList: { regular: string[]; dev: string[] } = {
  regular: [],
  dev: [],
};

export const addToInstallList = (packages: {
  regular: string[];
  dev: string[];
}) => {
  installList.regular.push(...packages.regular);
  installList.dev.push(...packages.dev);
};

export const installPackagesFromList = async () => {
  const { preferredPackageManager } = readConfigFile();

  if (installList.dev.length === 0 && installList.regular.length === 0) return;

  const dedupedList = {
    regular: [...new Set(installList.regular)],
    dev: [...new Set(installList.dev)],
  };

  const formattedInstallList = {
    regular: dedupedList.regular
      .map((i) => i.trim())
      .join(" ")
      .trim(),
    dev: dedupedList.dev
      .map((i) => i.trim())
      .join(" ")
      .trim(),
  };
  spinner.text = "Installing Packages";
  await installPackages(formattedInstallList, preferredPackageManager);
};
const shadCnComponentList: string[] = [];
export const addToShadcnComponentList = (components: string[]) =>
  shadCnComponentList.push(...components);
export const installShadcnComponentList = async () => {
  // consola.start("Installing shadcn components:", shadCnComponentList);
  if (shadCnComponentList.length === 0) return;
  spinner.text = "Installing ShadcnUI Components";
  await installShadcnUIComponents(shadCnComponentList);
  // consola.ready("Successfully installed components.");
};

const nextStepsList = [];
