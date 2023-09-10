import { DBField, ORMType } from "../../../../../types.js";
import { Schema } from "../../../types.js";
import { formatTableName, toCamelCase } from "../../../utils.js";

const generateAuthCheck = (belongsToUser: boolean) => {
  return belongsToUser ? "\n  const { session } = await getUserAuth();" : "";
};
const generateDrizzleImports = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCamelCase,
  } = formatTableName(tableName);
  return `import { db } from "@/lib/db";
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
}`;
};

const generatePrismaImports = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCamelCase,
  } = formatTableName(tableName);
  return `import { db } from "@/lib/db";${
    belongsToUser ? '\nimport { getUserAuth } from "@/lib/auth/utils";' : ""
  }
import { type ${tableNameSingularCapitalised}Id, ${tableNameSingular}IdSchema } from "@/lib/db/schema/${tableNameCamelCase}";
`;
};

const generateDrizzleGetQuery = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameFirstChar,
    tableNameSingularCapitalised,
    tableNameSingular,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNameSingularCapitalised}s = async () => {${getAuth}
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
`;
};

const generateDrizzleGetByIdQuery = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameFirstChar,
    tableNameSingularCapitalised,
    tableNameSingular,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNameSingularCapitalised}ById = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
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
};

const generatePrismaGetQuery = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNameSingularCapitalised}s = async () => {${getAuth}
  const ${tableNameFirstChar} = await db.${tableNameSingular}.findMany({${
    belongsToUser ? ` where: {userId: session?.user.id!}` : ""
  }${
    relations.length > 0
      ? ` include: { ${relations
          .map((relation) => `${relation.references.slice(0, -1)}: true`)
          .join(", ")}}`
      : ""
  }});
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};
`;
};

const generatePrismaGetByIdQuery = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNameSingularCapitalised}ById = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const ${tableNameFirstChar} = await db.${tableNameSingular}.findFirst({
    where: { id: ${tableNameSingular}Id${
    belongsToUser ? `, userId: session?.user.id!` : ""
  }}
${
  relations.length > 0
    ? ` include: { ${relations
        .map((relation) => `${relation.references.slice(0, -1)}: true`)
        .join(", ")} }`
    : ""
}  });
  return { ${tableNameCamelCase}: ${tableNameFirstChar} };
};
`;
};

export const generateQueries = {
  prisma: {
    imports: generatePrismaImports,
    get: generatePrismaGetQuery,
    getById: generatePrismaGetByIdQuery,
  },
  drizzle: {
    imports: generateDrizzleImports,
    get: generateDrizzleGetQuery,
    getById: generateDrizzleGetByIdQuery,
  },
};
