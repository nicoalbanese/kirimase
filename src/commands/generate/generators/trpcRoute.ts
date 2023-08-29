import { consola } from "consola";
import { createFile, readConfigFile } from "../../../utils.js";
import { Schema } from "../types.js";
import { formatTableName, toCamelCase } from "../utils.js";
import fs from "fs";

export const scaffoldTRPCRoute = async (schema: Schema) => {
  const { hasSrc } = readConfigFile();
  const { tableName } = schema;
  const { tableNameCamelCase } = formatTableName(tableName);
  const path = `${
    hasSrc ? "src/" : ""
  }lib/server/routers/${tableNameCamelCase}.ts`;
  createFile(path, generateRouteContent(schema));

  updateTRPCRouter(tableNameCamelCase);
};

function updateTRPCRouter(routerName: string): void {
  const { hasSrc } = readConfigFile();
  const filePath = `${hasSrc ? "src/" : ""}lib/server/routers/_app.ts`;

  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Add import statement after the last import
  const importInsertionPoint = fileContent.lastIndexOf("import");
  const nextLineAfterLastImport =
    fileContent.indexOf("\n", importInsertionPoint) + 1;
  const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
  const afterImport = fileContent.slice(nextLineAfterLastImport);
  const modifiedImportContent = `${beforeImport}import { ${routerName}Router } from "./${routerName}";\n${afterImport}`;

  // Add router initialization before the last line in the router block
  const routerBlockEnd = modifiedImportContent.indexOf("});");
  const beforeRouterBlockEnd =
    modifiedImportContent.lastIndexOf(",", routerBlockEnd) + 1;
  const beforeRouter = modifiedImportContent.slice(0, beforeRouterBlockEnd);
  const afterRouter = modifiedImportContent.slice(beforeRouterBlockEnd);
  const modifiedRouterContent = `${beforeRouter}\n  ${routerName}: ${routerName}Router,${afterRouter}`;
  fs.writeFileSync(filePath, modifiedRouterContent);

  console.log("File updated successfully.");
}

const generateRouteContent = (schema: Schema) => {
  const { tableName } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameCamelCase,
    tableNameCapitalised,
  } = formatTableName(tableName);

  return `import { get${tableNameSingularCapitalised}ById, get${tableNameCapitalised} } from "@/lib/api/${tableNameCamelCase}/queries";
import { publicProcedure, router } from "../trpc";
import {
  ${tableNameSingular}IdSchema,
  insert${tableNameSingularCapitalised}Schema,
  update${tableNameSingularCapitalised}Schema,
} from "@/lib/db/schema/${tableNameCamelCase}";
import { create${tableNameSingularCapitalised}, delete${tableNameSingularCapitalised}, update${tableNameSingularCapitalised} } from "@/lib/api/${tableNameCamelCase}/mutations";
export const ${tableNameCamelCase}Router = router({
  get${tableNameCapitalised}: publicProcedure.query(async () => {
    return get${tableNameCapitalised}();
  }),
  get${tableNameSingularCapitalised}ById: publicProcedure.input(${tableNameSingular}IdSchema).query(async ({ input }) => {
    return get${tableNameSingularCapitalised}ById(input.id);
  }),
  create${tableNameSingularCapitalised}: publicProcedure
    .input(insert${tableNameSingularCapitalised}Schema)
    .mutation(async ({ input }) => {
      return create${tableNameSingularCapitalised}(input);
    }),
  update${tableNameSingularCapitalised}: publicProcedure
    .input(update${tableNameSingularCapitalised}Schema)
    .mutation(async ({ input }) => {
      return update${tableNameSingularCapitalised}(input.id, input);
    }),
  delete${tableNameSingularCapitalised}: publicProcedure
    .input(${tableNameSingular}IdSchema)
    .mutation(async ({ input }) => {
      return delete${tableNameSingularCapitalised}(input.id);
    }),
});
`;
};
