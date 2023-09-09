import { Schema } from "../../../types.js";
import { formatTableName, toCamelCase } from "../../../utils.js";

export const generateQueryContent = (schema: Schema) => {
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
