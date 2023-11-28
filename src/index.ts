#!/usr/bin/env node

import { Command } from "commander";
import { initProject } from "./commands/init/index.js";
import { buildSchema } from "./commands/generate/index.js";
import { addPackage } from "./commands/add/index.js";

const program = new Command();
program.name("kirimase").description("Kirimase CLI").version("0.0.36");

addCommonOptions(program.command("init"))
  .description("initialise and configure kirimase within directory")
  .action(initProject);

program
  .command("generate")
  .description("Generate a new resource")
  .action(buildSchema);

addCommonOptions(program.command("add"))
  .description("Add and setup additional packages")
  .action(addPackage);

program.parse(process.argv);

function addCommonOptions(command: Command) {
  return command
    .option("-sf, --has-src-folder <has>", "has a src folder")
    .option(
      "-pm, --package-manager <pm>",
      "preferred package manager (npm, yarn, pnpm, bun)",
    )
    .option(
      "-cl, --component-lib <component-lib>",
      "preferred component library (shadcn-ui)",
    )
    .option("-o, --orm <orm>", "preferred orm (prisma, drizzle)")
    .option("-db, --db <db>", "preferred database (pg, mysql, sqlite)")
    .option("-dbp, --db-provider <db>", "database provider")
    .option("-a, --auth <auth>", "preferred auth (next-auth, clerk, lucia)")
    .option(
      "-ap, --auth-providers <auth-providers...>",
      "auth providers (if using next-auth - discord, google, github, apple)",
    )
    .option(
      "-mp, --misc-packages <packages...>",
      "misc packages (resend, stripe, trpc)",
    )
    .option(
      "-ie, --include-example <include>",
      "include example model in schema",
    );
}
