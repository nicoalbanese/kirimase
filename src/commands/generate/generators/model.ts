import {
  DBType,
  mysqlColumnType,
  pgColumnType,
  sqliteColumnType,
} from "../../../types.js";
import { createFile } from "../../../utils.js";
import { Schema } from "../types.js";
import {
  capitaliseForZodSchema,
  formatTableName,
  toCamelCase,
} from "../utils.js";

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

  // create mutationFile
  const mutationPath = `${hasSrc ? "src/" : ""}lib/api/${toCamelCase(
    tableName
  )}/mutations.ts`;
  createFile(mutationPath, generateMutationContent(schema));
}

export const createConfig = () => {
  return {
    pg: {
      tableFunc: "pgTable",
      typeMappings: {
        id: (name: string) => `serial('${name}').primaryKey()`,
        string: (name: string) => `varchar("${name}", { length: 256 })`,
        text: (name: string) => `text("${name}")`,
        number: (name: string) => `integer('${name}')`,
        float: (name: string) => `real('${name}')`,
        boolean: (name: string) => `boolean('${name}')`,
        references: (name: string, referencedTable: string = "REFERENCE") =>
          `integer('${name}').references(() => ${referencedTable}.id)`,
        // Add more types here as needed
        timestamp: (name: string) => `timestamp('${name}')`,
        date: (name: string) => `date('${name}')`,
        json: (name: string) => `json('${name}')`,
      } as Record<
        pgColumnType,
        (name: string, referencedTable?: string) => string
      >,
    },
    mysql: {
      tableFunc: "mysqlTable",
      typeMappings: {
        id: (name: string) => `serial('${name}').primaryKey()`,
        string: (name: string) => `varchar("${name}", { length: 256 })`,
        text: (name: string) => `text("${name}")`,
        number: (name: string) => `int('${name}')`,
        float: (name: string) => `real('${name}')`,
        boolean: (name: string) => `boolean('${name}')`,
        references: (name: string, referencedTable: string = "REFERENCE") =>
          `int('${name}').references(() => ${toCamelCase(referencedTable)}.id)`,
        date: (name: string) => `date('${name}')`,
        timestamp: (name: string) => `timestamp('${name}')`,
        json: (name: string) => `json('${name}')`,
      } as Record<
        mysqlColumnType,
        (name: string, referencedTable?: string) => string
      >,
    },
    sqlite: {
      tableFunc: "sqliteTable",
      typeMappings: {
        id: (name: string) => `integer('${name}').primaryKey()`,
        string: (name: string) => `text('${name}')`,
        number: (name: string) => `integer('${name}')`,
        boolean: (name: string) => `integer('${name}', { mode: boolean })`,
        references: (name: string, referencedTable: string = "REFERENCE") =>
          `int('${name}').references(() => ${toCamelCase(referencedTable)}.id)`,
        date: (name: string) => `integer('${name}', { mode: timestamp })`,
        timestamp: (name: string) =>
          `integer('${name}', { mode: timestamp_ms })`,
        blob: (name: string) => `blob('${name}')`,
      } as Record<sqliteColumnType, (name: string) => string>,
    },
  };
};

function generateModelContent(schema: Schema, dbType: DBType) {
  const { index, fields, tableName } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
  } = formatTableName(tableName);
  const relations = schema.fields.filter(
    (field) => field.type === "references"
  );

  const config = createConfig()[dbType];

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
        )}${field.notNull ? ".notNull()" : ""}`
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
export const insert${tableNameSingularCapitalised}Schema = createInsertSchema(${tableNameCamelCase}${
    relations.length > 0
      ? `, {\n  ${relations
          .map((relation) => `${toCamelCase(relation.name)}: z.coerce.number()`)
          .join(",\n")}\n}`
      : ""
  });
export type New${tableNameSingularCapitalised} = z.infer<typeof insert${tableNameSingularCapitalised}Schema>;

// Schema for selecting ${tableNameCamelCase} - can be used to validate API responses
export const select${tableNameSingularCapitalised}Schema = createSelectSchema(${tableNameCamelCase}, { 
  id: z.coerce.number()
});
export const update${tableNameSingularCapitalised}Schema = select${tableNameSingularCapitalised}Schema;

export type ${tableNameSingularCapitalised} = z.infer<typeof select${tableNameSingularCapitalised}Schema>;

export const ${tableNameSingular}IdSchema = select${tableNameSingularCapitalised}Schema.pick({ id: true });

`;

  return `${importStatement}\n\n${schemaContent}`;
}

// create queries and mutations folders

const generateQueryContent = (schema: Schema) => {
  const { tableName } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const relations = schema.fields.filter(
    (field) => field.type === "references"
  );
  // TODO: UPDATE IMPORTS to _IdSchema
  const template = `import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ${tableNameSingular}IdSchema, ${tableNameCamelCase} } from "@/lib/db/schema/${tableNameCamelCase}";
${
  relations.length > 0
    ? relations.map(
        (relation) =>
          `import { ${toCamelCase(
            relation.references
          )} } from "@/lib/db/schema/${toCamelCase(relation.references)}";`
      )
    : ""
}
export const get${tableNameSingularCapitalised}s = async () => {
  const ${tableNameFirstChar} = await db.select().from(${tableNameCamelCase})${
    relations.length > 0
      ? relations.map(
          (relation) =>
            `.leftJoin(${
              relation.references
            }, eq(${tableNameCamelCase}.${toCamelCase(
              relation.name
            )}, ${toCamelCase(relation.references)}.id))`
        )
      : ""
  };
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};

export const get${tableNameSingularCapitalised}ById = async (id: number) => {
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const [${tableNameFirstChar}] = await db.select().from(${tableNameCamelCase}).where(eq(${tableNameCamelCase}.id, ${tableNameSingular}Id))${
    relations.length > 0
      ? relations.map(
          (relation) =>
            `.leftJoin(${
              relation.references
            }, eq(${tableNameCamelCase}.${toCamelCase(
              relation.name
            )}, ${toCamelCase(relation.references)}.id))`
        )
      : ""
  };

  return { ${tableNameSingular}: ${tableNameFirstChar} };
};
`;
  return template;
};

const generateMutationContent = (schema: Schema) => {
  const { tableName } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);

  const template = `import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { New${tableNameSingularCapitalised}, insert${tableNameSingularCapitalised}Schema, ${tableNameCamelCase}, ${tableNameSingular}IdSchema } from "@/lib/db/schema/${tableNameCamelCase}";

export const create${tableNameSingularCapitalised} = async (${tableNameSingular}: New${tableNameSingularCapitalised}) => {
  const new${tableNameSingularCapitalised} = insert${tableNameSingularCapitalised}Schema.parse(${tableNameSingular});
  try {
    const [${tableNameFirstChar}] = await db.insert(${tableNameCamelCase}).values(new${tableNameSingularCapitalised}).returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};

export const update${tableNameSingularCapitalised} = async (id: number, ${tableNameSingular}: New${tableNameSingularCapitalised}) => {
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const new${tableNameSingularCapitalised} = insert${tableNameSingularCapitalised}Schema.parse(${tableNameSingular});
  try {
    const [${tableNameFirstChar}] = await db
     .update(${tableNameCamelCase})
     .set(new${tableNameSingularCapitalised})
     .where(eq(${tableNameCamelCase}.id, ${tableNameSingular}Id!))
     .returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};

export const delete${tableNameSingularCapitalised} = async (id: number) => {
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  try {
    const [${tableNameFirstChar}] = await db.delete(${tableNameCamelCase}).where(eq(${tableNameCamelCase}.id, ${tableNameSingular}Id!)).returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};

`;
  return template;
};
