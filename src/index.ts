#!/usr/bin/env node

import { Command } from "commander";
import { initProject } from "./commands/init/index.js";
import { buildSchema } from "./commands/scaffold/index.js";

const program = new Command();
program.name("kirimase").description("Kirimase CLI").version("0.0.1");

program
  .command("init")
  .description("init drizzle config with desired db type (pg, mysql, sqlite))")
  .action(initProject);

program
  .command("scaffold")
  .description("Scaffold a new resource")
  .action(buildSchema);

program.parse(process.argv);
