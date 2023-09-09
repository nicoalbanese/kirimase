import { DBProvider, DBType } from "../../../../types.js";
import { createFile, readConfigFile } from "../../../../utils.js";
import { prismaFormat, prismaGenerate } from "../../../add/orm/utils.js";
import { Schema } from "../../types.js";
import {
  addToPrismaSchema,
  addToPrismaModel,
  formatTableName,
  getReferenceFieldType,
  toCamelCase,
} from "../../utils.js";
import { createZodSchemas } from "./generators.js";
import { createOrmMappings } from "./utils.js";

export async function scaffoldModel(
  schema: Schema,
  dbType: DBType,
  hasSrc: boolean
) {
  const { tableName } = schema;
  const { orm, preferredPackageManager } = readConfigFile();

  // create model file
  const modelPath = `${hasSrc ? "src/" : ""}lib/db/schema/${toCamelCase(
    tableName
  )}.ts`;
  createFile(modelPath, generateModelContent(schema, dbType));
  if (orm === "prisma") {
    await prismaFormat(preferredPackageManager);
    await prismaGenerate(preferredPackageManager);
  }

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

const generateDrizzleSchema = (
  schema: Schema,
  mappings,
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
      return mappingFunction(field.name).split("(")[0];
    })
    .concat(mappings.typeMappings["id"]("id").split("(")[0]); // Assuming number (int) is always used for the 'id' field

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
          field.name,
          field.references,
          field.cascade
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
  id: ${mappings.typeMappings["id"]("id")},
${schemaFields}${
    schema.belongsToUser
      ? `,\n  userId: ${mappings.typeMappings["references"](
          "user_id",
          "users",
          true,
          "string"
        ).concat(".notNull()")},`
      : ""
  }
}${indexFormatted});\n`;

  return `${importStatement}\n\n${drizzleSchemaContent}\n\n${zodSchemas}`;
};

const generatePrismaSchema = (schema: Schema, mappings, zodSchemas: string) => {
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

function generateModelContent(schema: Schema, dbType: DBType) {
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

// create queries and mutations folders

const generateQueryContent = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const relations = schema.fields.filter(
    (field) => field.type === "references"
  );

  const getAuth = belongsToUser
    ? "\n  const { session } = await getUserAuth();"
    : "";

  const drizzleTemplate = `import { db } from "@/lib/db";
import { eq${belongsToUser ? ", and" : ""} } from "drizzle-orm";${
    belongsToUser ? '\nimport { getUserAuth } from "@/lib/auth/utils";' : ""
  }
import { type ${tableNameSingularCapitalised}Id, ${tableNameSingular}IdSchema, ${tableNameCamelCase} } from "@/lib/db/schema/${tableNameCamelCase}";
${
  relations.length > 0
    ? relations.map(
        (relation) =>
          `import { ${toCamelCase(
            relation.references
          )} } from "@/lib/db/schema/${toCamelCase(relation.references)}";\n`
      )
    : ""
}
export const get${tableNameSingularCapitalised}s = async () => {${getAuth}
  const ${tableNameFirstChar} = await db.select(${
    relations.length > 0
      ? `{ ${tableNameSingular}: ${tableNameCamelCase}, ${relations
          .map(
            (relation) =>
              `${relation.references.slice(0, -1)}: ${relation.references}`
          )
          .join(", ")} }`
      : ""
  }).from(${tableNameCamelCase})${
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
  }${
    belongsToUser
      ? `.where(eq(${tableNameCamelCase}.userId, session?.user.id!))`
      : ""
  };
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};

export const get${tableNameSingularCapitalised}ById = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const [${tableNameFirstChar}] = await db.select().from(${tableNameCamelCase}).where(${
    belongsToUser ? "and(" : ""
  }eq(${tableNameCamelCase}.id, ${tableNameSingular}Id)${
    belongsToUser
      ? `, eq(${tableNameCamelCase}.userId, session?.user.id!))`
      : ""
  })${
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
  const prismaTemplate = `import { db } from "@/lib/db";${
    belongsToUser ? '\nimport { getUserAuth } from "@/lib/auth/utils";' : ""
  }
import { type ${tableNameSingularCapitalised}Id, ${tableNameSingular}IdSchema } from "@/lib/db/schema/${tableNameCamelCase}";

export const get${tableNameSingularCapitalised}s = async () => {${getAuth}
  const ${tableNameFirstChar} = await db.${tableNameSingular}.findMany({${
    belongsToUser
      ? ` where: {${tableNameCamelCase}.userId: session?.user.id!}`
      : ""
  }${
    relations.length > 0
      ? ` include: { ${relations
          .map((relation) => `${relation.references.slice(0, -1)}: true`)
          .join(", ")} }`
      : ""
  }});
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};
// LEFT OFF HERE

export const get${tableNameSingularCapitalised}ById = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const ${tableNameFirstChar} = await db.${tableNameSingular}.findFirst({${
    belongsToUser
      ? ` where: {${tableNameCamelCase}.userId: session?.user.id!}`
      : ""
  }${
    relations.length > 0
      ? ` include: { ${relations
          .map((relation) => `${relation.references.slice(0, -1)}: true`)
          .join(", ")} }`
      : ""
  }});
  return { ${tableNameSingular}: ${tableNameFirstChar} };
};
`;

  return drizzleTemplate;
};

const generateMutationContent = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const { driver, orm } = readConfigFile();
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = belongsToUser
    ? "\n  const { session } = await getUserAuth();"
    : "";

  const template = `import { db } from "@/lib/db";
import { ${belongsToUser ? "and, " : ""}eq } from "drizzle-orm";
import { 
  ${tableNameSingularCapitalised}Id, 
  New${tableNameSingularCapitalised}Params,
  Update${tableNameSingularCapitalised}Params, 
  update${tableNameSingularCapitalised}Schema,
  insert${tableNameSingularCapitalised}Schema, 
  ${tableNameCamelCase},
  ${tableNameSingular}IdSchema 
} from "@/lib/db/schema/${tableNameCamelCase}";${
    belongsToUser ? '\nimport { getUserAuth } from "@/lib/auth/utils";' : ""
  }

export const create${tableNameSingularCapitalised} = async (${tableNameSingular}: New${tableNameSingularCapitalised}Params) => {${getAuth}
  const new${tableNameSingularCapitalised} = insert${tableNameSingularCapitalised}Schema.parse(${
    belongsToUser
      ? `{ ...${tableNameSingular}, userId: session?.user.id! }`
      : `${tableNameSingular}`
  });
  try {
    ${
      driver === "mysql" ? "" : `const [${tableNameFirstChar}] =  `
    }await db.insert(${tableNameCamelCase}).values(new${tableNameSingularCapitalised})${
    driver === "mysql"
      ? "\n    return { success: true }"
      : `.returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };`
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};

export const update${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id, ${tableNameSingular}: Update${tableNameSingularCapitalised}Params) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const new${tableNameSingularCapitalised} = update${tableNameSingularCapitalised}Schema.parse(${
    belongsToUser
      ? `{ ...${tableNameSingular}, userId: session?.user.id! }`
      : `${tableNameSingular}`
  });
  try {
    ${driver === "mysql" ? "" : `const [${tableNameFirstChar}] =  `}await db
     .update(${tableNameCamelCase})
     .set(new${tableNameSingularCapitalised})
     .where(${
       belongsToUser ? "and(" : ""
     }eq(${tableNameCamelCase}.id, ${tableNameSingular}Id!)${
    belongsToUser
      ? `, eq(${tableNameCamelCase}.userId, session?.user.id!)))`
      : ")"
  }${
    driver === "mysql"
      ? "\n    return {success: true}"
      : `
     .returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };`
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};

export const delete${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  try {
    ${
      driver === "mysql" ? "" : `const [${tableNameFirstChar}] =  `
    }await db.delete(${tableNameCamelCase}).where(${
    belongsToUser ? "and(" : ""
  }eq(${tableNameCamelCase}.id, ${tableNameSingular}Id!)${
    belongsToUser
      ? `, eq(${tableNameCamelCase}.userId, session?.user.id!)))`
      : ")"
  }${
    driver === "mysql"
      ? "\n    return {success: true}"
      : `
    .returning();
    return { ${tableNameSingular}: ${tableNameFirstChar} };`
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};

`;
  return template;
};
