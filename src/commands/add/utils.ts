import { AvailablePackage, PackageType } from "../../types.js";
import { createFile, readConfigFile, replaceFile } from "../../utils.js";
import fs from "fs";
import { rootLayoutTs } from "./generators.js";

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
  auth: [{ name: "Auth.js (NextAuth)", value: "next-auth" }],
  misc: [
    { name: "TRPC", value: "trpc" },
    { name: "Shadcn UI", value: "shadcn-ui" },
  ],
};

export const addContextProviderToLayout = (
  provider: "NextAuthProvider" | "TrpcProvider" | "ShadcnToast"
) => {
  const { hasSrc } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}app/layout.tsx`;

  // Create the root layout file if it doesn't exist
  if (!fs.existsSync(path)) createFile(path, rootLayoutTs());

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
