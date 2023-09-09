import { readConfigFile } from "../../../../../utils.js";
import { Schema } from "../../../types.js";
import { formatTableName } from "../../../utils.js";

export const generateMutationContent = (schema: Schema) => {
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
