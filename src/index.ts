#!/usr/bin/env node

import { Command } from "commander";
import { intro, outro, select, spinner, group, cancel } from "@clack/prompts";
import { setTimeout } from "node:timers/promises";
import { drizzle } from "@/prompts/drizzle";
import { prisma } from "@/prompts/prisma";

const program = new Command();

async function init() {
  intro("Welcome to Kirimase!");

  const userResults = await group(
    {
      orm: () =>
        select({
          message: "Select an ORM",
          options: [
            { value: "drizzle", label: "Drizzle ORM" },
            { value: "prisma", label: "Prisma ORM" },
          ],
          initialValue: "drizzle",
        }),
      drizzle: ({ results: { orm } }) =>
        orm === "drizzle" ? drizzle() : undefined,
      prisma: ({ results: { orm } }) =>
        orm === "prisma" ? prisma() : undefined,
    },
    {
      onCancel: () => {
        cancel("Initialization cancelled.");
        process.exit(0);
      },
    },
  );

  const s = spinner();
  s.start("Creating your project");

  await setTimeout(2000); // Simulate work

  s.stop("Project created successfully!");

  outro(`✨ Project is ready! Happy coding!`);
  console.log(userResults);
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
