import { DBProvider, DBType } from "../../../../../types.js";
import { readConfigFile } from "../../../../../utils.js";
import { Schema, TypeMap } from "../../../types.js";
import {
  addToPrismaModel,
  addToPrismaSchema,
  formatTableName,
  getReferenceFieldType,
  toCamelCase,
} from "../../../utils.js";
import { createOrmMappings } from "../utils.js";
import { createZodSchemas } from "./generators.js";

const generateDrizzleSchema = (
  schema: Schema,
  mappings: TypeMap,
  provider: DBProvider,
  dbType: DBType,
  zodSchemas: string
) => {
  const { tableName, fields, index } = schema;
  const { tableNameCamelCase, tableNameCapitalised } =
    formatTableName(tableName);
  const usedTypes: string[] = fields
    .map((field) => {
      const mappingFunction = mappings.typeMappings[field.type];
      // Assuming 'field.name' contains the appropriate value for the 'name' parameter
      return mappingFunction({ name: field.name }).split("(")[0];
    })
    .concat(mappings.typeMappings["id"]({ name: "id" }).split("(")[0]); // Assuming number (int) is always used for the 'id' field

  const referenceFields = fields.filter((field) => field.type === "references");
  const referenceImports = referenceFields.map(
    (field) =>
      `import { ${toCamelCase(field.references)} } from "./${toCamelCase(
        field.references
      )}"`
  );

  const uniqueTypes = Array.from(
    new Set(
      usedTypes.concat(
        schema.belongsToUser ? [getReferenceFieldType("string")[dbType]] : []
      )
    )
  );
  const importStatement = `import { ${uniqueTypes
    .join(", ")
    .concat(
      `, ${mappings.tableFunc}`
    )} } from "drizzle-orm/${dbType}-core";\nimport { createInsertSchema, createSelectSchema } from "drizzle-zod";\nimport { z } from "zod";\n${
    referenceImports.length > 0 ? referenceImports.join("\n") : ""
  }${
    schema.belongsToUser && provider !== "planetscale"
      ? '\nimport { users } from "./auth";'
      : ""
  }
import { get${tableNameCapitalised} } from "@/lib/api/${tableNameCamelCase}/queries";`;

  const schemaFields = fields
    .map(
      (field) =>
        `  ${toCamelCase(field.name)}: ${mappings.typeMappings[field.type](
          field
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

  const drizzleSchemaContent = `export const ${tableNameCamelCase} = ${
    mappings.tableFunc
  }('${tableName}', {
  id: ${mappings.typeMappings["id"]({ name: "id" })},
${schemaFields}${
    schema.belongsToUser
      ? `,\n  userId: ${mappings.typeMappings["references"]({
          name: "user_id",
          references: "users",
          cascade: true,
          referenceIdType: "string",
        }).concat(".notNull()")},`
      : ""
  }
}${indexFormatted});\n`;

  return `${importStatement}\n\n${drizzleSchemaContent}\n\n${zodSchemas}`;
};

const generatePrismaSchema = (
  schema: Schema,
  mappings: TypeMap,
  zodSchemas: string
) => {
  const {
    tableNameCapitalised,
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
  } = formatTableName(schema.tableName);
  const prismaSchemaContent = `model ${tableNameSingularCapitalised} {
    id    String @id @default(cuid())
  ${schema.fields
    .map((field) => mappings.typeMappings[field.type](field))
    .join("\n  ")}
}`;
  addToPrismaSchema(prismaSchemaContent, tableNameSingularCapitalised);
  const relations = schema.fields.filter(
    (field) => field.type.toLowerCase() === "references"
  );
  relations.forEach((relation) => {
    const { references } = relation;
    const { tableNameSingularCapitalised: singularCapitalised } =
      formatTableName(references);
    addToPrismaModel(
      singularCapitalised,
      `${tableNameCamelCase} ${tableNameSingularCapitalised}[]`
    );
  });
  const importStatement = `import { ${tableNameSingular}Schema } from "@/zodAutoGenSchemas";
import { z } from "zod";
import { get${tableNameCapitalised} } from "@/lib/api/${tableNameCamelCase}/queries";
`;

  return `${importStatement}\n\n${zodSchemas}`;
};

export function generateModelContent(schema: Schema, dbType: DBType) {
  const { provider, orm } = readConfigFile();
  const mappings = createOrmMappings()[orm][dbType];
  const zodSchemas = createZodSchemas(schema, orm);

  if (orm === "drizzle") {
    return generateDrizzleSchema(
      schema,
      mappings,
      provider,
      dbType,
      zodSchemas
    );
  }
  if (orm === "prisma") {
    return generatePrismaSchema(schema, mappings, zodSchemas);
  }
}
