import { ORMType } from "../../../../types.js";
import { Schema } from "../../types.js";
import {
  ZodMapping,
  formatTableName,
  getNonStringFields,
  getZodMappings,
  toCamelCase,
} from "../../utils.js";

const createInsertZodSchema = (
  schema: Schema,
  orm: ORMType,
  zodMappings: ZodMapping[]
) => {
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
  } = formatTableName(schema.tableName);
  const insertSchema = `export const insert${tableNameSingularCapitalised}Schema = ${
    orm === "drizzle"
      ? `createInsertSchema(${tableNameCamelCase})`
      : `${tableNameSingular}Schema`
  };
`;
  const insertParams = `export const insert${tableNameSingularCapitalised}Params = ${
    orm === "drizzle"
      ? `createSelectSchema(${tableNameCamelCase}, `
      : `${tableNameSingular}Schema.extend(`
  }{${
    zodMappings.length > 0
      ? `\n  ${zodMappings
          .map(
            (field) => `${toCamelCase(field.name)}: z.coerce.${field.type}()`
          )
          .join(`,\n  `)}\n`
      : ""
  }}).omit({ 
  id: true${schema.belongsToUser ? ",\n  userId: true" : ""}
});
`;
  return `${insertSchema}\n${insertParams}`;
};

const createUpdateZodSchema = (
  schema: Schema,
  orm: ORMType,
  zodMappings: ZodMapping[]
) => {
  const {
    tableNameSingular,
    tableNameCamelCase,
    tableNameSingularCapitalised,
  } = formatTableName(schema.tableName);
  const updateSchema = `export const update${tableNameSingularCapitalised}Schema = ${
    orm === "drizzle"
      ? `createSelectSchema(${tableNameCamelCase})`
      : `${tableNameSingular}Schema`
  };
`;
  const updateParams = `export const update${tableNameSingularCapitalised}Params = ${
    orm === "drizzle"
      ? `createSelectSchema(${tableNameCamelCase},`
      : `update${tableNameSingularCapitalised}Schema.extend(`
  }{${
    zodMappings.length > 0
      ? `\n  ${zodMappings
          .map(
            (field) => `${toCamelCase(field.name)}: z.coerce.${field.type}()`
          )
          .join(`,\n  `)}\n`
      : ""
  }})${
    schema.belongsToUser
      ? `.omit({ 
  userId: true
});`
      : ""
  }
`;
  return `${updateSchema}\n${updateParams}`;
};

const createIdZodSchema = (schema: Schema) => {
  const { tableNameSingular, tableNameSingularCapitalised } = formatTableName(
    schema.tableName
  );
  return `export const ${tableNameSingular}IdSchema = update${tableNameSingularCapitalised}Schema.pick({ id: true });`;
};

const createTypesForSchema = (schema: Schema) => {
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameCapitalised,
    tableNameSingular,
  } = formatTableName(schema.tableName);
  return `// Types for ${tableNameCamelCase} - used to type API request params and within Components
export type ${tableNameSingularCapitalised} = z.infer<typeof update${tableNameSingularCapitalised}Schema>;
export type New${tableNameSingularCapitalised} = z.infer<typeof insert${tableNameSingularCapitalised}Schema>;
export type New${tableNameSingularCapitalised}Params = z.infer<typeof insert${tableNameSingularCapitalised}Params>;
export type Update${tableNameSingularCapitalised}Params = z.infer<typeof update${tableNameSingularCapitalised}Params>;
export type ${tableNameSingularCapitalised}Id = z.infer<typeof ${tableNameSingular}IdSchema>["id"];
    
// this type infers the return from get${tableNameCapitalised}() - meaning it will include any joins
export type Complete${tableNameSingularCapitalised} = Awaited<ReturnType<typeof get${tableNameCapitalised}>>["${tableNameCamelCase}"][number];
`;
};

export const createZodSchemas = (schema: Schema, orm: ORMType) => {
  const { fields, tableName } = schema;

  // get non string fields
  const nonStringFields = getNonStringFields(fields);
  const zodMappings = getZodMappings(nonStringFields);

  const { tableNameCamelCase } = formatTableName(tableName);
  return `// Schema for ${tableNameCamelCase} - used to validate API requests
${createInsertZodSchema(schema, orm, zodMappings)}
${createUpdateZodSchema(schema, orm, zodMappings)}
${createIdZodSchema(schema)}

${createTypesForSchema(schema)}
`;
};
