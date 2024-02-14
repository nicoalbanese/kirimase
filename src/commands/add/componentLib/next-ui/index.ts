/*
  Author: Affan Siddiqui
  Created: 13-02-2024
  Github: siddiquiaffan
*/

import {
    addPackageToConfig,
    createFile,
    readConfigFile,
    replaceFile,
    updateConfigFile,
    // replaceFile,
} from "../../../../utils.js";
import {
    addContextProviderToRootLayout,
    addToInstallList,
} from "../../utils.js";
import { generateNextUIWithThemeProvider, generateTailwindConfigWithNextUIContent, generateThemeToggler } from "./generators.js";

export const installNextUI = async () => {
    const {
        rootPath
    } = readConfigFile();

    // run shadcn ui install
    addToInstallList({
        regular: ["@nextui-org/react", "framer-motion", "next-themes", "lucide-react"], dev: []
    })

    // add tailwind config
    createFile("tailwind.config.ts", generateTailwindConfigWithNextUIContent(rootPath))

    // generate next ui & theme provider
    createFile(
        rootPath.concat("components/NextUIWithThemeProvider.tsx"),
        generateNextUIWithThemeProvider()
    );

    // generate themeswitcher component
    createFile(
        rootPath.concat("components/ui/ThemeSwitcher.tsx"),
        generateThemeToggler()
    )

    // wrap root layout with next ui provider
    addContextProviderToRootLayout("NextUIWithThemeProvider");

    addPackageToConfig("next-ui");
    updateConfigFile({ componentLib: "next-ui" });

}

export const updateSignInComponentWithNextUI = () => {
    const { hasSrc, alias } = readConfigFile();
    const filepath = "components/auth/SignIn.tsx";
    const updatedContent = `"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import {Button} from "@nextui-org/react";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <Button variant="flat" color="danger" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
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
