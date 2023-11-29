import {
  AuthType,
  DBField,
  DBProvider,
  DBType,
  DrizzleColumnType,
  ORMType,
} from "../../../../../types.js";
import { readConfigFile } from "../../../../../utils.js";
import { AuthSubTypeMapping } from "../../../../add/utils.js";
import { formatFilePath, getFilePaths } from "../../../../filePaths/index.js";
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

const getUsedTypes = (fields: DBField[], mappings: TypeMap) => {
  return fields
    .map((field) => {
      const mappingFunction = mappings.typeMappings[field.type];
      // Assuming 'field.name' contains the appropriate value for the 'name' parameter
      return mappingFunction({ name: field.name }).split("(")[0];
    })
    .concat(
      mappings.typeMappings["id"]({ name: "id" }).split("(")[0],
    ) as DrizzleColumnType[]; // Assuming number (int) is always used for the 'id' field
};

const getReferenceImports = (fields: DBField[]) => {
  const referenceFields = fields.filter((field) => field.type === "references");
  return referenceFields.map(
    (field) =>
      `import { ${toCamelCase(field.references)} } from "./${toCamelCase(
        field.references,
      )}"`,
  );
};

const getUniqueTypes = (
  usedTypes: string[],
  belongsToUser: boolean,
  dbType: DBType,
) => {
  return Array.from(
    new Set(
      usedTypes.concat(
        belongsToUser ? [getReferenceFieldType("string")[dbType]] : [],
      ),
    ),
  );
};

const generateImportStatement = (
  orm: ORMType,
  schema: Schema,
  mappings: TypeMap,
  authType: AuthType,
  dbType?: DBType,
  provider?: DBProvider,
) => {
  const { alias } = readConfigFile();
  const { fields, belongsToUser, tableName } = schema;
  const authSubType = AuthSubTypeMapping[authType];
  const { tableNameCamelCase, tableNameCapitalised, tableNameSingular } =
    formatTableName(tableName);
  const { shared } = getFilePaths();

  if (orm === "drizzle") {
    const usedTypes = getUsedTypes(fields, mappings);
    const referenceImports = getReferenceImports(fields);

    const uniqueTypes = getUniqueTypes(usedTypes, belongsToUser, dbType);
    return `import { ${uniqueTypes
      .join(", ")
      .concat(
        `, ${mappings.tableFunc}`,
      )} } from "drizzle-orm/${dbType}-core";\nimport { createInsertSchema, createSelectSchema } from "drizzle-zod";\nimport { z } from "zod";\n${
      referenceImports.length > 0 ? referenceImports.join("\n") : ""
    }${
      belongsToUser && provider !== "planetscale" && authSubType !== "managed"
        ? `\nimport { users } from "${formatFilePath(shared.auth.authSchema, {
            prefix: "alias",
            removeExtension: true,
          })}";`
        : ""
    }
import { get${tableNameCapitalised} } from "${formatFilePath(
      shared.orm.servicesDir,
      { prefix: "alias", removeExtension: false },
    )}/${tableNameCamelCase}/queries";`;
  }
  if (orm === "prisma")
    return `import { ${tableNameSingular}Schema } from "${alias}/zodAutoGenSchemas";
import { z } from "zod";
import { get${tableNameCapitalised} } from "${formatFilePath(
      shared.orm.servicesDir,
      { prefix: "alias", removeExtension: false },
    )}/${tableNameCamelCase}/queries";
`;
};

const generateFieldsForSchema = (fields: DBField[], mappings: TypeMap) => {
  return fields
    .map(
      (field) =>
        `  ${toCamelCase(field.name)}: ${mappings.typeMappings[field.type](
          field,
        )}${field.notNull ? ".notNull()" : ""}`,
    )
    .join(",\n");
};

const generateIndex = (schema: Schema) => {
  const { tableName, index } = schema;
  const { tableNameCamelCase } = formatTableName(tableName);
  return index
    ? `, (${tableNameCamelCase}) => {
  return {
    ${toCamelCase(
      index,
    )}Index: uniqueIndex('${index}_idx').on(${tableNameCamelCase}.${toCamelCase(
      index,
    )}),
  }
}`
    : "";
};

const addUserReferenceIfBelongsToUser = (
  schema: Schema,
  mappings: TypeMap,
  authType: AuthType,
) => {
  const authSubtype = AuthSubTypeMapping[authType];
  const value = schema.belongsToUser
    ? `,\n  userId: ${mappings.typeMappings["references"]({
        name: "user_id",
        references: "users",
        cascade: true,
        referenceIdType: "string",
      }).concat(".notNull()")},`
    : "";
  const valueIfManaged = value.replace(
    `.references(() => users.id, { onDelete: "cascade" })`,
    "",
  );
  return authSubtype === "managed" ? valueIfManaged : value;
};

const generateDrizzleSchema = (
  schema: Schema,
  mappings: TypeMap,
  provider: DBProvider,
  dbType: DBType,
  zodSchemas: string,
  authType: AuthType,
) => {
  const { tableName, fields } = schema;
  const { tableNameCamelCase } = formatTableName(tableName);

  const importStatement = generateImportStatement(
    "drizzle",
    schema,
    mappings,
    authType,
    dbType,
    provider,
  );

  const userGeneratedFields = generateFieldsForSchema(fields, mappings);
  const indexFormatted = generateIndex(schema);

  const drizzleSchemaContent = `export const ${tableNameCamelCase} = ${
    mappings.tableFunc
  }('${tableName}', {
  id: ${mappings.typeMappings["id"]({ name: "id" })},
${userGeneratedFields}${addUserReferenceIfBelongsToUser(
    schema,
    mappings,
    authType,
  )}
}${indexFormatted});\n`;

  return `${importStatement}\n\n${drizzleSchemaContent}\n\n${zodSchemas}`;
};

const generateIndexFields = (
  schema: Schema,
  relations: DBField[],
  usingPlanetscale: boolean,
): string => {
  const { index, belongsToUser } = schema;
  // Handle the case where index is null and there are no relations and usingPlanetscale is false
  if (index === null && relations.length === 0 && !usingPlanetscale) {
    return "";
  }

  // Start building the @@index
  let fields: string[] = [];

  // If there is an index, push it to fields array
  if (index !== null) {
    fields.push(toCamelCase(index));
  }

  if (belongsToUser) {
    fields.push("userId");
  }

  // If using planetscale and there are relations, add relations to fields array
  if (usingPlanetscale && relations.length > 0) {
    fields = fields.concat(
      relations.map((relation) => toCamelCase(relation.name)),
    );
  }

  const uniqueFields = Array.from(new Set(fields));

  return `\n  ${uniqueFields
    .map((field) => `@@index([${field}])`)
    .join("\n  ")}`;
};

const generatePrismaSchema = (
  schema: Schema,
  mappings: TypeMap,
  zodSchemas: string,
  usingPlanetscale: boolean,
  authType: AuthType,
) => {
  const { tableNameSingularCapitalised, tableNameCamelCase } = formatTableName(
    schema.tableName,
  );
  const authSubtype = AuthSubTypeMapping[authType];
  const relations = schema.fields.filter(
    (field) => field.type === "References",
  );
  const prismaSchemaContent = `model ${tableNameSingularCapitalised} {
    id    String @id @default(cuid())
  ${schema.fields
    .map((field) => mappings.typeMappings[field.type](field))
    .join("\n  ")}
  ${
    schema.belongsToUser
      ? `userId String${
          authSubtype === "managed"
            ? ""
            : "\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)"
        }`
      : ""
  }${generateIndexFields(schema, relations, usingPlanetscale)}
}`;
  addToPrismaSchema(prismaSchemaContent, tableNameSingularCapitalised);
  if (schema.belongsToUser && authSubtype === "self-hosted")
    addToPrismaModel(
      "User",
      `${tableNameCamelCase} ${tableNameSingularCapitalised}[]`,
    );

  relations.forEach((relation) => {
    const { references } = relation;
    const { tableNameSingularCapitalised: singularCapitalised } =
      formatTableName(references);
    addToPrismaModel(
      singularCapitalised,
      `${tableNameCamelCase} ${tableNameSingularCapitalised}[]`,
    );
  });
  const importStatement = generateImportStatement(
    "prisma",
    schema,
    mappings,
    authType,
  );

  return `${importStatement}\n\n${zodSchemas}`;
};

export function generateModelContent(schema: Schema, dbType: DBType) {
  const { provider, orm, auth } = readConfigFile();
  const mappings = createOrmMappings()[orm][dbType];
  const zodSchemas = createZodSchemas(schema, orm);

  if (orm === "drizzle") {
    return generateDrizzleSchema(
      schema,
      mappings,
      provider,
      dbType,
      zodSchemas,
      auth,
    );
  }
  if (orm === "prisma") {
    return generatePrismaSchema(
      schema,
      mappings,
      zodSchemas,
      provider === "planetscale",
      auth,
    );
  }
}
