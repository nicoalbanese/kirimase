import { drizzle } from "@/extensions/drizzle/prompts";
import { prisma } from "@/prompts/prisma";
import { compileTemplates } from "@/utils";
import { isCancel } from "@clack/core";
import { select, intro, spinner, outro } from "@clack/prompts";
import { exit } from "process";

export const getInitialConfig = async () => {
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

export async function init() {
  intro("Welcome to Kirimase!");

  const userResults = await getInitialConfig();

  const s = spinner();
  s.start("Creating your project");

  await new Promise((resolve) => setTimeout(resolve, 2000));
  s.stop("Cooking your project!");

  console.log();
  await compileTemplates(userResults);

  outro(`✨ Project is ready! Happy coding!`);
}
