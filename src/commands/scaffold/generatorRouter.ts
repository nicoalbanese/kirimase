import { consola } from "consola";
import { createFile, createFolder } from "../../utils.js";
import { DBField } from "../../types.js";
import { generateModelContent } from "./model/generators.js";
import { generateAPIRoute } from "./controller/generators.js";
import { snakeToKebab, toCamelCase } from "./utils.js";

export function scaffoldResource(schema: {
  tableName: string;
  fields: DBField[];
  index?: string;
}) {
  const { tableName, fields, index } = schema;

  createModel(tableName, fields, index);
  createAPIRoutes(tableName, fields);
  // createViews
  // Other scaffolding logic here (e.g., views, tests, etc.)
}

function createModel(tableName: string, fields: DBField[], index?: string) {
  createFile(
    `src/lib/db/schema/${snakeToKebab(tableName)}.ts`,
    generateModelContent(tableName, fields, "pg", index)
  );
  consola.success("Model created successfully!");
}

function createAPIRoutes(tableName: string, fields: DBField[]) {
  // Logic to create the controller file
  // createFolder(`src/app/api/${toCamelCase(tableName)}`);
  createFile(
    `src/app/api/${toCamelCase(tableName)}/route.ts`,
    generateAPIRoute(tableName, fields)
  );
  consola.success("API route created successfully!");
}
