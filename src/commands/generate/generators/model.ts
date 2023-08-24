import { DBType } from "../../../types.js";
import { createFile } from "../../../utils.js";
import { Schema } from "../types.js";
import { capitaliseForZodSchema, toCamelCase } from "../utils.js";

export function scaffoldModel(schema: Schema, dbType: DBType, hasSrc: boolean) {
  const { tableName } = schema;

  // create model file
  const modelPath = `${hasSrc ? "src/" : ""}lib/db/schema/${toCamelCase(
    tableName
  )}.ts`;
  createFile(modelPath, generateModelContent(schema, dbType));

  // create queryFile
  const queryPath = `${hasSrc ? "src/" : ""}lib/api/${toCamelCase(
    tableName
  )}/queries.ts`;
  createFile(queryPath, generateQueryContent(schema));
}

function generateModelContent(schema: Schema, dbType: DBType) {
  const { index, fields, tableName } = schema;
  const tableNameCamelCase = toCamelCase(tableName);
  const tableNameSingularCapitalised =
    capitaliseForZodSchema(tableNameCamelCase);
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
  }[dbType];

  const usedTypes: string[] = fields
    .map((field) => {
      const mappingFunction = config.typeMappings[field.type];
      // Assuming 'field.name' contains the appropriate value for the 'name' parameter
      return mappingFunction(field.name).split("(")[0];
    })
    .concat(config.typeMappings["id"]("id").split("(")[0]); // Assuming number (int) is always used for the 'id' field

  const referenceFields = fields.filter((field) => field.type === "references");
  const referenceImports = referenceFields.map(
    (field) =>
      `import { ${toCamelCase(field.references)} } from "./${toCamelCase(
        field.references
      )}"`
  );

  const uniqueTypes = Array.from(new Set(usedTypes));
  const importStatement = `import {${uniqueTypes
    .join(", ")
    .concat(
      `, ${config.tableFunc}`
    )}} from 'drizzle-orm/${dbType}-core';\nimport { createInsertSchema, createSelectSchema } from 'drizzle-zod';\nimport { z } from 'zod';\n${
    referenceImports.length > 0 ? referenceImports.join("\n") : ""
  }`;

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
    ? `, (${tableNameCamelCase}) => {
  return {
    ${toCamelCase(
      index
    )}Index: uniqueIndex('${index}_idx').on(${tableNameCamelCase}.${toCamelCase(
        index
      )}),
  }
}`
    : "";

  const schemaContent = `export const ${tableNameCamelCase} = ${
    config.tableFunc
  }('${tableName}', {
  id: ${config.typeMappings["id"]("id")},
${schemaFields}
}${indexFormatted});\n 

// Schema for inserting ${tableNameCamelCase} - can be used to validate API requests
export const insert${tableNameSingularCapitalised}Schema = createInsertSchema(${tableNameCamelCase});
export type New${tableNameSingularCapitalised} = z.infer<typeof insert${tableNameSingularCapitalised}Schema>;

// Schema for selecting ${tableNameCamelCase} - can be used to validate API responses
export const select${tableNameSingularCapitalised}Schema = createSelectSchema(${tableNameCamelCase});
export type ${tableNameSingularCapitalised} = z.infer<typeof select${tableNameSingularCapitalised}Schema>;
`;

  return `${importStatement}\n\n${schemaContent}`;
}

// create queries and mutations folders

const generateQueryContent = (schema: Schema) => {
  const { tableName } = schema;
  const tableNameCamelCase = toCamelCase(tableName);
  const tableNameSingularCapitalised =
    capitaliseForZodSchema(tableNameCamelCase);
  const tableNameFirstChar = tableNameCamelCase.charAt(0);
  const tableNameSingular = tableNameCamelCase.slice(0, -1);

  const template = `import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { select${tableNameSingularCapitalised}Schema, ${tableNameCamelCase} } from "@/lib/db/schema/${tableNameCamelCase}";


export const get${tableNameSingularCapitalised}s = async () => {
  const ${tableNameFirstChar} = await db.select().from(${tableNameCamelCase});
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};

export const get${tableNameSingularCapitalised}ById = async (id: number) => {
  const { id: ${tableNameSingular}Id } = select${tableNameSingularCapitalised}Schema.parse({ id });
  const [${tableNameFirstChar}] = await db.select().from(${tableNameCamelCase}).where(eq(${tableNameCamelCase}.id, ${tableNameSingular}Id));
  return { ${tableNameSingular}: ${tableNameFirstChar} };
};
`;
  return template;
};
