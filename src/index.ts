#!/usr/bin/env node

import { Command } from "commander";
import { add } from "./commands/add";
import { init } from "./commands/init";

const program = new Command();

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
