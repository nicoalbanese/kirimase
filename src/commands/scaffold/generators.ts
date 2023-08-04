import { consola } from "consola";
import { createFile } from "../../utils.js";
import { generateModelContent } from "./utils.js";
import { DBField } from "../../types.js";

export function scaffoldResource(schema: {
  tableName: string;
  fields: DBField[];
  index?: string;
}) {
  const { tableName, fields, index } = schema;
  createModel(tableName, fields, index);
  // createAPIRoutes(tableName, fields);
  // createViews
  // Other scaffolding logic here (e.g., views, tests, etc.)
}

function createModel(tableName: string, fields: DBField[], index?: string) {
  // Logic to create the model file
  console.log(tableName, fields);

  consola.info("reached function");
  // need to create a json to store important details so i can access it here
  // createFile(
  //   "",
  //   generateModelContent(tableName, fields, "pg", index)
  // );
}

// function createAPIRoutes(tableName: string, properties: DBField[]) {
//   // Logic to create the controller file
//   console.log(tableName, properties);
// }
