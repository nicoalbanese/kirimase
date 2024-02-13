/*
  Author: Affan Siddiqui
  Created: 13-02-2024
  Github: siddiquiaffan
*/

import {
    addPackageToConfig,
    createFile,
    readConfigFile,
    updateConfigFile,
    // replaceFile,
} from "../../../../utils.js";
import {
    addContextProviderToRootLayout,
    addToInstallList,
} from "../../utils.js";
import { generateNextUIWithThemeProvider, generateTailwindConfigWithNextUIContent, generateThemeSwitcher } from "./generators.js";

export const installNextUI = async () => {
    const {
        rootPath
    } = readConfigFile();

    // run shadcn ui install
    addToInstallList({
        regular: ["@nextui-org/react", "framer-motion"], dev: []
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
        generateThemeSwitcher()
    )

    // wrap root layout with next ui provider
    addContextProviderToRootLayout("NextUIWithThemeProvider");

    addPackageToConfig("next-ui");
    updateConfigFile({ componentLib: "next-ui" });

}