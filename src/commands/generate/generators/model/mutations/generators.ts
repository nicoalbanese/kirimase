import { DBType } from "../../../../../types.js";
import { Schema } from "../../../types.js";
import { formatTableName } from "../../../utils.js";
import { authForWhereClausePrisma, generateAuthCheck } from "../utils.js";

const generateDrizzleImports = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
  } = formatTableName(tableName);

  return `import { db } from "@/lib/db";
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
`;
};

const generateDrizzleCreateMutation = (schema: Schema, driver: DBType) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(belongsToUser);
  return `export const create${tableNameSingularCapitalised} = async (${tableNameSingular}: New${tableNameSingularCapitalised}Params) => {${getAuth}
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
`;
};
const generateDrizzleUpdateMutation = (schema: Schema, driver: DBType) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameFirstChar,
    tableNameSingular,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(belongsToUser);
  return `export const update${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id, ${tableNameSingular}: Update${tableNameSingularCapitalised}Params) => {${getAuth}
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
`;
};
const generateDrizzleDeleteMutation = (schema: Schema, driver: DBType) => {
  const { tableName, belongsToUser } = schema;
  const getAuth = generateAuthCheck(belongsToUser);
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
    tableNameFirstChar,
  } = formatTableName(tableName);
  return `export const delete${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
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
};

const generatePrismaImports = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameCamelCase,
    tableNameSingular,
  } = formatTableName(tableName);

  return `import { db } from "@/lib/db";
import { 
  ${tableNameSingularCapitalised}Id, 
  New${tableNameSingularCapitalised}Params,
  Update${tableNameSingularCapitalised}Params, 
  update${tableNameSingularCapitalised}Schema,
  insert${tableNameSingularCapitalised}Schema, 
  ${tableNameSingular}IdSchema 
} from "@/lib/db/schema/${tableNameCamelCase}";${
    belongsToUser ? '\nimport { getUserAuth } from "@/lib/auth/utils";' : ""
  }
`;
};
const generatePrismaCreateMutation = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameFirstChar,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(belongsToUser);
  return `export const create${tableNameSingularCapitalised} = async (${tableNameSingular}: New${tableNameSingularCapitalised}Params) => {${getAuth}
  const new${tableNameSingularCapitalised} = insert${tableNameSingularCapitalised}Schema.parse(${
    belongsToUser
      ? `{ ...${tableNameSingular}, userId: session?.user.id! }`
      : `${tableNameSingular}`
  });
  try {
    const ${tableNameFirstChar} = await db.${tableNameSingular}.create({ data: new${tableNameSingularCapitalised} });
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};
`;
};
const generatePrismaUpdateMutation = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameFirstChar,
    tableNameSingular,
  } = formatTableName(tableName);
  const getAuth = generateAuthCheck(belongsToUser);

  return `export const update${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id, ${tableNameSingular}: Update${tableNameSingularCapitalised}Params) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  const new${tableNameSingularCapitalised} = update${tableNameSingularCapitalised}Schema.parse(${
    belongsToUser
      ? `{ ...${tableNameSingular}, userId: session?.user.id! }`
      : `${tableNameSingular}`
  });
  try {
    const ${tableNameFirstChar} = await db.${tableNameSingular}.update({ where: { id: ${tableNameSingular}Id${authForWhereClausePrisma(
    belongsToUser
  )} }, data: new${tableNameSingularCapitalised}})
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};
`;
};
const generatePrismaDeleteMutation = (schema: Schema) => {
  const { tableName, belongsToUser } = schema;
  const getAuth = generateAuthCheck(belongsToUser);
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameFirstChar,
  } = formatTableName(tableName);
  return `export const delete${tableNameSingularCapitalised} = async (id: ${tableNameSingularCapitalised}Id) => {${getAuth}
  const { id: ${tableNameSingular}Id } = ${tableNameSingular}IdSchema.parse({ id });
  try {
    const ${tableNameFirstChar} = await db.${tableNameSingular}.delete({ where: { id: ${tableNameSingular}Id${authForWhereClausePrisma(
    belongsToUser
  )} }})
    return { ${tableNameSingular}: ${tableNameFirstChar} };
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    return { error: message };
  }
};
`;
};

export const generateMutations = {
  prisma: {
    imports: generatePrismaImports,
    create: generatePrismaCreateMutation,
    update: generatePrismaUpdateMutation,
    delete: generatePrismaDeleteMutation,
  },
  drizzle: {
    imports: generateDrizzleImports,
    create: generateDrizzleCreateMutation,
    update: generateDrizzleUpdateMutation,
    delete: generateDrizzleDeleteMutation,
  },
};
