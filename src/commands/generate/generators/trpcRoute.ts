import { createFile, readConfigFile } from "../../../utils.js";
import { Schema } from "../types.js";
import { formatTableName, toCamelCase } from "../utils.js";

export const scaffoldTRPCRoute = async (schema: Schema) => {
  const { hasSrc } = readConfigFile();
  const { tableName } = schema;
  const path = `${hasSrc ? "src/" : ""}lib/server/routers/${toCamelCase(
    tableName
  )}.ts`;
  createFile(path, generateRouteContent(schema));
};

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
