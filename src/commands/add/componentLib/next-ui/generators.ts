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
    "${rootPath}components/**/*.{ts,tsx}",

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

export const generateNextUIWithThemeProvider = () => {
  return `"use client";

import * as React from "react";
import {NextUIProvider} from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function NextUIWithThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextUIProvider>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </NextUIProvider>
}
`;
}

export const generateThemeToggler = () => {
  return `"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="flat" color="danger" isIconOnly>
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem onClick={() => setTheme("light")}>
          Light
        </DropdownItem>
        <DropdownItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownItem>
        <DropdownItem onClick={() => setTheme("system")}>
          System
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
`;
};