import { drizzle } from "@/extensions/drizzle/config";
import { getUserResults } from "..";
import { templates } from "@/extensions/drizzle/templates";

export const compileTemplates = (
  input: Awaited<ReturnType<typeof getUserResults>>,
) => {
  if (input.drizzle) {
    const compiled = drizzle.compile(templates, input.drizzle);
    console.log(compiled);
  }
};
