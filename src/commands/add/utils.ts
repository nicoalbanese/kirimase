import { consola } from "consola";
import {
  AuthSubType,
  AuthType,
  AvailablePackage,
  PackageType,
} from "../../types.js";
import { readConfigFile, replaceFile } from "../../utils.js";
import fs from "fs";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";

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
    | "ThemeProvider",
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
        { prefix: "alias", removeExtension: true },
      )}";`;
      break;
    case "TrpcProvider":
      importStatement = `import TrpcProvider from "${formatFilePath(
        trpc.trpcProvider,
        { removeExtension: true, prefix: "alias" },
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
        shared.auth.navbarComponent,
        { prefix: "alias", removeExtension: true },
      )}";`;
      break;
    case "ThemeProvider":
      importStatement = `import { ThemeProvider } from "${alias}/components/ThemeProvider";`;
      break;
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const navbarExists = fileContent.includes("<Navbar />");
  const rootChildrenText = !navbarExists
    ? "{children}"
    : `<div>\n<Navbar />\n<main className="max-w-3xl mx-auto md:p-0 px-4 mt-4">\n{children}\n</main>\n</div>`;
  let replacementText = "";
  switch (provider) {
    case "ShadcnToast":
      replacementText = `${rootChildrenText}\n<Toaster />\n`;
      break;
    case "Navbar":
      replacementText = `<div>\n<Navbar />\n<main className="max-w-3xl mx-auto md:p-0 px-4 mt-4">\n{children}\n</main>\n</div>`;
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
    : `<div>\n<Navbar />\n<main className="max-w-3xl mx-auto md:p-0 px-4 mt-4">\n{children}\n</main>\n</div>`;
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText,
  );
  replaceFile(path, newLayoutContent);
};

export const AuthSubTypeMapping: Record<AuthType, AuthSubType> = {
  clerk: "managed",
  kinde: "managed",
  "next-auth": "self-hosted",
  lucia: "managed",
};
