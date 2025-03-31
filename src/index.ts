#!/usr/bin/env node

import { Command } from "commander";
import { intro, outro, select, spinner, isCancel } from "@clack/prompts";
import { setTimeout } from "node:timers/promises";
import { drizzle } from "@/extensions/drizzle/prompts";
import { prisma } from "@/prompts/prisma";
import { exit } from "./utils/clack";
import { compileTemplates } from "./utils";

const program = new Command();

export const getUserResults = async () => {
  const orm = await select<any, "drizzle" | "prisma">({
    message: "Select an ORM",
    options: [
      { value: "drizzle", label: "Drizzle ORM" },
      { value: "prisma", label: "Prisma ORM" },
    ],
    initialValue: "drizzle",
  });

  isCancel(orm) && exit();

  let drizzleResults = undefined;
  let prismaResult = undefined;

  if (orm === "drizzle") {
    drizzleResults = await drizzle();
  } else if (orm === "prisma") {
    prismaResult = await prisma();
  }

  return {
    orm,
    drizzle: drizzleResults,
    prisma: prismaResult,
  };
};

async function init() {
  intro("Welcome to Kirimase!");

  const userResults = await getUserResults();

  const s = spinner();
  s.start("Creating your project");

  await setTimeout(2000); // Simulate work

  console.log();
  compileTemplates(userResults);

  s.stop("Project created successfully!");

  outro(`✨ Project is ready! Happy coding!`);
}

async function add(packageName: string) {
  const s = spinner();
  s.start(`Adding ${packageName} to your project`);

  await setTimeout(1000); // Simulate work

  s.stop(`Added ${packageName} successfully!`);
}

program
  .name("kirimase")
  .description("A Rails-like CLI for building full-stack Next.js apps faster")
  .version("0.0.60");

program.command("init").description("Initialize a new project").action(init);

program
  .command("add")
  .description("Add a package to your project")
  .argument("<package>", "package to add")
  .action(add);

program.parse();
