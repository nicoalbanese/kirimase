import { consola } from "consola";
import { AvailablePackage, PackageType } from "../../types.js";
import { readConfigFile, replaceFile } from "../../utils.js";
import fs from "fs";

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
  ],
  misc: [
    { name: "TRPC", value: "trpc" },
    { name: "Shadcn UI", value: "shadcn-ui" },
    { name: "Resend", value: "resend" },
  ],
};

export const addContextProviderToLayout = (
  provider:
    | "NextAuthProvider"
    | "TrpcProvider"
    | "ShadcnToast"
    | "ClerkProvider"
) => {
  const { hasSrc } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/layout.tsx`;

  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);

  let importStatement: string;
  switch (provider) {
    case "NextAuthProvider":
      importStatement = `import NextAuthProvider from "@/lib/auth/Provider";`;
      break;
    case "TrpcProvider":
      importStatement = `import TrpcProvider from "@/lib/trpc/Provider";`;
      break;
    case "ShadcnToast":
      importStatement = `import { Toaster } from "@/components/ui/toaster";`;
      break;
    case "ClerkProvider":
      importStatement = 'import { ClerkProvider } from "@clerk/nextjs";';
      break;
  }

  // check if the provider already exists
  if (fileContent.includes(importStatement)) {
    consola.info(`Provider ${provider} already exists in layout.tsx`);
    return;
  }
  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const newLayoutContent =
    provider === "ShadcnToast"
      ? modifiedImportContent.replace("{children}", "{children}\n<Toaster />\n")
      : modifiedImportContent.replace(
          "{children}",
          `\n<${provider}>{children}</${provider}>\n`
        );
  replaceFile(path, newLayoutContent);
};
