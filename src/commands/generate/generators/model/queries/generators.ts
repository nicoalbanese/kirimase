import { DBField } from "../../../../../types.js";
import pluralize from "pluralize";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../../filePaths/index.js";
import { Schema } from "../../../types.js";
import { formatTableName, toCamelCase } from "../../../utils.js";
import { generateAuthCheck } from "../utils.js";

const generateDrizzleImports = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCamelCase,
  } = formatTableName(tableName);
  const { shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  return `import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { eq${belongsToUser ? ", and" : ""} } from "drizzle-orm";${
    belongsToUser
      ? `\nimport { getUserAuth } from "${formatFilePath(
          shared.auth.authUtils,
          { prefix: "alias", removeExtension: true },
        )}";`
      : ""
  }
import { type ${tableNameSingularCapitalised}Id, ${tableNameSingular}IdSchema, ${tableNameCamelCase} } from "${formatFilePath(
    shared.orm.schemaDir,
    { prefix: "alias", removeExtension: false },
  )}/${tableNameCamelCase}";
${
  relations.length > 0
    ? relations.map(
        (relation) =>
          `import { ${toCamelCase(
            relation.references,
          )} } from "${formatFilePath(shared.orm.schemaDir, {
            prefix: "alias",
            removeExtension: false,
          })}/${toCamelCase(relation.references)}";\n`,
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
  const { shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  return `import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";${
    belongsToUser
      ? `\nimport { getUserAuth } from "${formatFilePath(
          shared.auth.authUtils,
          { prefix: "alias", removeExtension: true },
        )}";`
      : ""
  }
import { type ${tableNameSingularCapitalised}Id, ${tableNameSingular}IdSchema } from "${formatFilePath(
    shared.orm.schemaDir,
    { removeExtension: false, prefix: "alias" },
  )}/${tableNameCamelCase}";
`;
};

const generateDrizzleGetQuery = (schema: Schema, relations: DBField[]) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameCamelCase,
    tableNameFirstChar,
    tableNamePluralCapitalised,
    tableNameSingular,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNamePluralCapitalised} = async () => {${getAuth}
  const ${tableNameFirstChar} = await db.select(${
    relations.length > 0
      ? `{ ${tableNameSingular}: ${tableNameCamelCase}, ${relations
          .map(
            (relation) =>
              `${pluralize.singular(
                toCamelCase(relation.references),
              )}: ${toCamelCase(relation.references)}`,
          )
          .join(", ")} }`
      : ""
  }).from(${tableNameCamelCase})${
    relations.length > 0
      ? relations.map(
          (relation) =>
            `.leftJoin(${toCamelCase(
              relation.references,
            )}, eq(${tableNameCamelCase}.${toCamelCase(
              relation.name,
            )}, ${toCamelCase(relation.references)}.id))`,
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
            `.leftJoin(${toCamelCase(
              relation.references,
            )}, eq(${tableNameCamelCase}.${toCamelCase(
              relation.name,
            )}, ${toCamelCase(relation.references)}.id))`,
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
    tableNamePluralCapitalised,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(schema.belongsToUser);
  return `export const get${tableNamePluralCapitalised} = async () => {${getAuth}
  const ${tableNameFirstChar} = await db.${tableNameSingular}.findMany({${
    belongsToUser ? ` where: {userId: session?.user.id!}` : ""
  }${belongsToUser && relations.length > 0 ? ", " : ""}${
    relations.length > 0
      ? `include: { ${relations
          .map(
            (relation) =>
              `${pluralize.singular(toCamelCase(relation.references))}: true`,
          )
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
    }}${
      relations.length > 0
        ? `,\n    include: { ${relations
            .map(
              (relation) =>
                `${pluralize.singular(toCamelCase(relation.references))}: true`,
            )
            .join(", ")} }\n  `
        : ""
    }});
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
