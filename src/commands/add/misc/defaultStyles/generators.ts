import { warn } from "console";
import { existsSync, readFileSync } from "fs";

export const generateGlobalsCss = () => {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;

    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
 
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
 
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
 
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
 
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
 
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
 
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
 
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
 
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
 
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
 
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
 
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
};

export const generateUpdatedTWConfig = () => {
  const colors = `extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },`;
  const twConfigPath = "tailwind.config.ts";
  const twConfigExists = existsSync(twConfigPath);
  if (!twConfigExists) return;
  const twConfigContents = readFileSync(twConfigPath, "utf-8");
  const newContents = twConfigContents.replace("extend: {", colors);
  return newContents;
};
