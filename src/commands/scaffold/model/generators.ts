import type { DBField, DBType } from "../../../types.js";
import { capitaliseForZodSchema, toCamelCase } from "../utils.js";

export function generateModelContent(
  tableName: string,
  fields: DBField[],
  driver: DBType,
  index?: string
) {
  const config = {
    pg: {
      tableFunc: "pgTable",
      typeMappings: {
        id: (name: string) => `serial('${name}').primaryKey()`,
        string: (name: string) => `varchar("${name}", { length: 256 })`,
        text: (name: string) => `text("${name}")`,
        number: (name: string) => `integer('${name}')`,
        references: (name: string, referencedTable: string = "REFERENCE") =>
          `integer('${name}').references(() => ${referencedTable}.id)`,
        // Add more types here as needed
        boolean: (name: string) => `boolean('${name}')`,
      },
    },
    mysql: {
      tableFunc: "mysqlTable",
      typeMappings: {
        id: (name: string) => `serial('${name}').primaryKey()`,
        string: (name: string) => `varchar("${name}", { length: 256 })`,
        number: (name: string) => `int('${name}')`,
        references: (name: string, referencedTable: string = "REFERENCE") =>
          `int('${name}').references(() => ${toCamelCase(referencedTable)}.id)`,
        boolean: (name: string) => `boolean('${name}')`,
      },
    },
    sqlite: {
      tableFunc: "sqliteTable",
      typeMappings: {
        string: (name: string) => `text('${name}')`,
        number: (name: string) => `integer('${name}')`,
      },
    },
  }[driver];

  const usedTypes: string[] = fields
    .map((field) => {
      const mappingFunction = config.typeMappings[field.type];
      // Assuming 'field.name' contains the appropriate value for the 'name' parameter
      return mappingFunction(field.name).split("(")[0];
    })
    .concat(config.typeMappings["id"]("id").split("(")[0]); // Assuming number (int) is always used for the 'id' field

  const uniqueTypes = Array.from(new Set(usedTypes));
  const importStatement = `import {${uniqueTypes
    .join(", ")
    .concat(
      `, ${config.tableFunc}`
    )}} from 'drizzle-orm/${driver}-core';\nimport { createInsertSchema, createSelectSchema } from 'drizzle-zod';\nimport { InferModel } from 'drizzle-orm';`;

  const schemaFields = fields
    .map(
      (field) =>
        `  ${toCamelCase(field.name)}: ${config.typeMappings[field.type](
          field.name,
          field.references
        )}`
    )
    .join(",\n");

  const indexFormatted = index
    ? `, (${toCamelCase(tableName)}) => {
  return {
    ${toCamelCase(index)}Index: uniqueIndex('${index}_idx').on(${toCamelCase(
        tableName
      )}.${toCamelCase(index)}),
  }
}`
    : "";

  const schema = `export const ${toCamelCase(tableName)} = ${
    config.tableFunc
  }('${tableName}', {
  id: ${config.typeMappings["id"]("id")},
${schemaFields}
}${indexFormatted});\n\n 

export type ${capitaliseForZodSchema(
    tableName
  )} = InferModel<typeof ${toCamelCase(tableName)}>; // return type when queried


// Schema for inserting ${toCamelCase(
    tableName
  )} - can be used to validate API requests
export const insert${capitaliseForZodSchema(
    toCamelCase(tableName)
  )}Schema = createInsertSchema(${toCamelCase(tableName)});

// Schema for selecting ${toCamelCase(
    tableName
  )} - can be used to validate API responses
export const select${capitaliseForZodSchema(
    toCamelCase(tableName)
  )}Schema = createSelectSchema(${toCamelCase(tableName)});`;

  return `${importStatement}\n\n${schema}`;
}
