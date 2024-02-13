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
import { generateTailwindConfigWithNextUIContent } from "./generators.js";

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


    // wrap root layout with next ui provider
    addContextProviderToRootLayout("NextUIProvider");

    addPackageToConfig("next-ui");
    updateConfigFile({ componentLib: "next-ui" });

}