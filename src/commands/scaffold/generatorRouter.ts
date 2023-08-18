import { createFile, createFolder } from "../../utils.js";
import { DBField, ScaffoldSchema } from "../../types.js";
import { generateModelContent } from "./model/generators.js";
import { generateAPIRoute as generateAPIRouteContent } from "./controller/generators.js";
import { snakeToKebab, toCamelCase } from "./utils.js";
import { createViewsAndComponents } from "./views/index.js";

// move createfile logic to the index of each file

export function scaffoldResource(schema: ScaffoldSchema) {
  createModel(schema);
  createAPIRoutes(schema);
  createViews(schema);
  // Other scaffolding logic here (e.g., views, tests, etc.)
}

function createModel(schema: ScaffoldSchema) {
  const { tableName, fields, index } = schema;

  createFile(
    `src/lib/db/schema/${snakeToKebab(tableName)}.ts`,
    generateModelContent(tableName, fields, "pg", index)
  );
}

function createAPIRoutes(schema: ScaffoldSchema) {
  const { tableName, fields } = schema;

  createFile(
    `src/app/api/${toCamelCase(tableName)}/route.ts`,
    generateAPIRouteContent(tableName, fields)
  );
}

function createViews(schema: ScaffoldSchema) {
  createViewsAndComponents(schema);
}
