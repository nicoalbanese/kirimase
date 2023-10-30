#!/usr/bin/env node

import { Command } from "commander";
import { initProject } from "./commands/init/index.js";
import { buildSchema } from "./commands/generate/index.js";
import { addPackage } from "./commands/add/index.js";
import { updateConfigFileAfterUpdate } from "./utils.js";
import { ColumnType, DBField } from "./types.js";

const program = new Command();
program.name("kirimase").description("Kirimase CLI").version("0.0.22");

addCommonOptions(program.command("init"))
  .description("initialise and configure kirimase within directory")
  .action(initProject);

program
  .command("generate")
  .description("Generate a new resource")
  // .option("-r, --resources <resources...>", "resources")
  // .option("-t, --table <table>", "table")
  // .option("-b, --belongs-to-user <belongs-to-user>", "belongs to user")
  // .option("-i, --index <index>", "index")
  // .option("-m, --migrate <migrate>", "migrate")
  // .option(
  //   "-f, --field <field>",
  //   "fields. Format: name:type:references:not-null:cascade. Example: blog:string::true:true",
  //   (value, previous) => {
  //     const [name, type, references, notNull, cascade] = value.split(":");
  //     const field: DBField = {
  //       name,
  //       type: type as ColumnType,
  //       references,
  //       notNull: notNull === "true",
  //       cascade: cascade === "true",
  //     };
  //     previous.push(field);
  //     return previous;
  //   },
  //   []
  // )
  .action(buildSchema);

addCommonOptions(program.command("add"))
  .description("Add and setup additional packages")
  .action(addPackage);

program
  .command("update-config")
  .description("Update Kirimase config file after update")
  .action(updateConfigFileAfterUpdate);

program.parse(process.argv);

function addCommonOptions(command: Command) {
  return command
    .option("-sf, --has-src-folder <has>", "has a src folder")
    .option(
      "-pm, --package-manager <pm>",
      "preferred package manager (npm, yarn, pnpm, bun)"
    )
    .option(
      "-cl, --component-lib <component-lib>",
      "preferred component library (shadcn-ui)"
    )
    .option("-o, --orm <orm>", "preferred orm (prisma, drizzle)")
    .option("-db, --db <db>", "preferred database (pg, mysql, sqlite)")
    .option("-a, --auth <auth>", "preferred auth (next-auth, clerk, lucia)")
    .option(
      "-ap, --auth-providers <auth-providers...>",
      "auth providers (if using next-auth - discord, google, github, apple)"
    )
    .option(
      "-mp, --misc-packages <packages...>",
      "misc packages (resend, stripe, trpc)"
    )
    .option(
      "-ie, --include-example <include>",
      "include example model in schema"
    );
}
