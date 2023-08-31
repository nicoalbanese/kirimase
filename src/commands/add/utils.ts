import { AvailablePackage } from "../../types.js";
import { readConfigFile, replaceFile } from "../../utils.js";
import fs from "fs";

export const Packages: { name: string; value: AvailablePackage }[] = [
  { name: "Drizzle", value: "drizzle" },
  { name: "TRPC", value: "trpc" },
  { name: "Auth.js", value: "next-auth" },
];

export const addContextProviderToLayout = (
  provider: "NextAuthProvider" | "TrpcProvider"
) => {
  const { hasSrc } = readConfigFile();
  const path = `${hasSrc ? "src" : ""}/app/layout.tsx`;

  const fileContent = fs.readFileSync(path, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);
  const importStatement =
    provider === "NextAuthProvider"
      ? `import NextAuthProvider from "@/lib/auth/Provider";`
      : `import TrpcProvider from "@/lib/trpc/Provider";`;

  const modifiedImportContent = `${beforeImport}${importStatement}\n${afterImport}`;

  const newLayoutContent = modifiedImportContent.replace(
    "{children}",
    `\n<${provider}>{children}</${provider}>\n`
  );
  replaceFile(path, newLayoutContent);
};
