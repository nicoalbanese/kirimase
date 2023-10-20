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
    { name: "Stripe", value: "stripe" },
    { name: "Resend", value: "resend" },
  ],
  componentLib: [{ name: "Shadcn UI", value: "shadcn-ui" }],
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
    case "Navbar":
      importStatement = 'import Navbar from "@/components/Navbar";';
      break;
    case "ThemeProvider":
      importStatement =
        'import { ThemeProvider } from "@/components/ThemeProvider";';
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
    : `<main className="max-w-3xl mx-auto md:p-0 p-6">\n<Navbar />\n{children}\n</main>`;
  let replacementText = "";
  switch (provider) {
    case "ShadcnToast":
      replacementText = `${rootChildrenText}\n<Toaster />\n`;
      break;
    case "Navbar":
      replacementText = `<main className="max-w-3xl mx-auto md:p-0 p-6">\n<Navbar />\n{children}\n</main>`;
      break;
    case "ThemeProvider":
      replacementText = `\n<${provider} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>${rootChildrenText}</${provider}>\n`;
      break;
    default:
      replacementText = `\n<${provider}>${rootChildrenText}</${provider}>\n`;
      break;
  }

  const searchValue = !navbarExists
    ? "{children}"
    : `<main className="max-w-3xl mx-auto md:p-0 p-6">\n<Navbar />\n{children}\n</main>`;
  const newLayoutContent = modifiedImportContent.replace(
    searchValue,
    replacementText
  );
  replaceFile(path, newLayoutContent);
};
