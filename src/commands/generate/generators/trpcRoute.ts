import { consola } from "consola";
import { createFile, readConfigFile, replaceFile } from "../../../utils.js";
import { Schema } from "../types.js";
import { formatTableName } from "../utils.js";
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

// function updateTRPCRouterOld(routerName: string): void {
//   const { hasSrc } = readConfigFile();
//   const filePath = `${hasSrc ? "src/" : ""}lib/server/routers/_app.ts`;
//
//   const fileContent = fs.readFileSync(filePath, "utf-8");
//
//   // Add import statement after the last import
//   const importInsertionPoint = fileContent.lastIndexOf("import");
//   const nextLineAfterLastImport =
//     fileContent.indexOf("\n", importInsertionPoint) + 1;
//   const beforeImport = fileContent.slice(0, nextLineAfterLastImport);
//   const afterImport = fileContent.slice(nextLineAfterLastImport);
//   const modifiedImportContent = `${beforeImport}import { ${routerName}Router } from "./${routerName}";\n${afterImport}`;
//
//   // Add router initialization before the last line in the router block
//   const routerBlockEnd = modifiedImportContent.indexOf("});");
//   const beforeRouterBlockEnd =
//     modifiedImportContent.lastIndexOf(",", routerBlockEnd) + 1;
//   const beforeRouter = modifiedImportContent.slice(0, beforeRouterBlockEnd);
//   const afterRouter = modifiedImportContent.slice(beforeRouterBlockEnd);
//   const modifiedRouterContent = `${beforeRouter}\n  ${routerName}: ${routerName}Router,${afterRouter}`;
//   replaceFile(filePath, modifiedRouterContent);
//
//   consola.success(`Added ${routerName} router to root router successfully.`);
// }

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
  const newImportStatement = `import { ${routerName}Router } from "./${routerName}";\n`;
  const withNewImport = `${beforeImport}${newImportStatement}${afterImport}`;

  let modifiedRouterContent = "";

  if (withNewImport.includes("router({})")) {
    // Handle empty router
    const beforeRouterBlock = withNewImport.indexOf("router({})");
    const afterRouterBlock = withNewImport.slice(
      beforeRouterBlock + "router({})".length
    );
    modifiedRouterContent = `${withNewImport.slice(
      0,
      beforeRouterBlock
    )}router({ ${routerName}: ${routerName}Router })${afterRouterBlock}`;
  } else if (withNewImport.match(/router\({ \w+: \w+Router }\)/)) {
    // Single-line router
    const singleRouterMatch = withNewImport.match(
      /router\({ \w+: \w+Router }\)/
    );
    const oldRouter = singleRouterMatch[0];
    const newRouter = oldRouter.replace(
      "}",
      `,\n  ${routerName}: ${routerName}Router,\n  }`
    );
    modifiedRouterContent = withNewImport.replace(oldRouter, newRouter);
  } else {
    // Regular multi-line router
    const routerBlockEnd = withNewImport.indexOf("});");
    const beforeRouterBlockEnd = withNewImport.lastIndexOf(
      "\n",
      routerBlockEnd
    );
    const beforeRouter = withNewImport.slice(0, beforeRouterBlockEnd);
    const afterRouter = withNewImport.slice(beforeRouterBlockEnd);
    const newRouterStatement = `\n  ${routerName}: ${routerName}Router,`;
    modifiedRouterContent = `${beforeRouter}${newRouterStatement}${afterRouter}`;
  }

  replaceFile(filePath, modifiedRouterContent);

  consola.success(`Added ${routerName} router to root router successfully.`);
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
  insert${tableNameSingularCapitalised}Params,
  update${tableNameSingularCapitalised}Params,
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
    .input(insert${tableNameSingularCapitalised}Params)
    .mutation(async ({ input }) => {
      return create${tableNameSingularCapitalised}(input);
    }),
  update${tableNameSingularCapitalised}: publicProcedure
    .input(update${tableNameSingularCapitalised}Params)
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
