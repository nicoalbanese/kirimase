#!/usr/bin/env node

import { Command } from "commander";
import { initProject } from "./commands/init/index.js";
import { buildSchema } from "./commands/generate/index.js";
import { addPackage } from "./commands/add/index.js";
import { updateConfigFileAfterUpdate } from "./utils.js";
import { getCurrentSchemas } from "./commands/generate/utils.js";
import { consola } from "consola";

const program = new Command();
program.name("kirimase").description("Kirimase CLI").version("0.0.11");

program
  .command("init")
  .description("initialise and configure kirimase within directory")
  .action(initProject);

program
  .command("generate")
  .description("Generate a new resource")
  .action(buildSchema);

program
  .command("add")
  .description("Add and setup additional packages")
  .action(addPackage);

program
  .command("update-config")
  .description("Update Kirimase config file after update")
  .action(updateConfigFileAfterUpdate);
program
  .command("schemas")
  .description("List all schemas")
  .action(() => consola.info(getCurrentSchemas()));

program.parse(process.argv);
