import { drizzle } from "@/extensions/drizzle/config";
import { getUserResults } from "..";
import { templates } from "@/extensions/drizzle/templates";
import { confirmOperation } from "./file-operations";

export const compileTemplates = async (
  input: Awaited<ReturnType<typeof getUserResults>>,
) => {
  if (input.drizzle) {
    const compiled = drizzle.compile(templates, input.drizzle);
    for (const template of compiled.templates) {
      const proceed = await confirmOperation(template);
      console.log(`Proceeding with ${template.path}`);
    }
  }
};
