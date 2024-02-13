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

export const generateThemeSwitcher = () => {
  return `"use client";

import {useTheme} from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) return null

  return (
    <div>
      The current theme is: {theme}
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  )
};`
}