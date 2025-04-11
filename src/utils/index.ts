import { drizzle } from "@/extensions/drizzle/config";
import { templates } from "@/extensions/drizzle/templates";
import { confirmOperation } from "./file-operations";
import { getInitialConfig } from "@/commands/init";

export const compileTemplates = async (
  input: Awaited<ReturnType<typeof getInitialConfig>>,
) => {
  if (input.drizzle) {
    const compiled = drizzle.compile(templates, input.drizzle);
    for (const template of compiled.templates) {
      const proceed = await confirmOperation(template);
      console.log(`Proceeding with ${template.path}`);
    }
  }
};
