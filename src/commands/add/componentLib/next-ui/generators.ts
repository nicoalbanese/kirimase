/*
  Author: Affan Siddiqui
  Created: 13-02-2024
  Github: siddiquiaffan
*/

// import { readConfigFile } from "../../../../utils.js";

import { readConfigFile, replaceFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const generateTailwindConfigWithNextUIContent = (rootPath: string) => `// tailwind.config.js
const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "${rootPath}app/**/*.{ts,tsx}", 
    "${rootPath}components/**/*.{ts,tsx}"

    // nextui content
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui()],
};`

export const generateNextUIProvider = () => {
  return `import * as React from "react";
import { NextUIProvider } from "@nextui-org/react";

export function NextUIProvider({ children }: ) {
  return <NextThemesProvider>{children}</NextThemesProvider>;
}
`;
};