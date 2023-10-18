import { existsSync, readFileSync } from "fs";
import { replaceFile } from "../../../../utils.js";
import { consola } from "consola";

export function addToDrizzleModel(modelName: string, attributesToAdd: string) {
  const hasSchema = existsSync("prisma/schema.prisma");
  if (!hasSchema) {
    console.error("Prisma schema not found!");
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  if (
    !schema.includes(attributesToAdd.split(" ")[1]) &&
    schema.includes(modelName)
  ) {
    // Find the start and end positions of the specified model
    const { modelEnd } = getPrismaModelStartAndEnd(schema, modelName);
    // Split the schema and insert the attributes at the right position
    const beforeModelEnd = schema.substring(0, modelEnd);
    const afterModelEnd = schema.substring(modelEnd);

    const newSchema =
      beforeModelEnd + "  " + attributesToAdd + "\n" + afterModelEnd;
    replaceFile("prisma/schema.prisma", newSchema);
    consola.info("Updated Drizzle schema");
  }
}
