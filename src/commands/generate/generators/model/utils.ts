import { readConfigFile } from "../../../../utils.js";
import { ORMTypeMap, TypeMap } from "../../types.js";
import {
  formatTableName,
  getReferenceFieldType,
  toCamelCase,
} from "../../utils.js";

export const prismaMappings = {
  typeMappings: {
    String: ({ name, notNull }) =>
      `${toCamelCase(name)} String${notNull ? "" : "?"}`,
    Int: ({ name, notNull }) => `${toCamelCase(name)} Int${notNull ? "" : "?"}`,
    BigInt: ({ name, notNull }) =>
      `${toCamelCase(name)} BigInt${notNull ? "" : "?"}`,
    Float: ({ name, notNull }) =>
      `${toCamelCase(name)} Float${notNull ? "" : "?"}`,
    Boolean: ({ name, notNull }) =>
      `${toCamelCase(name)} Boolean${notNull ? "" : "?"}`,
    References: ({ references, cascade, notNull }) => {
      const { tableNameSingular, tableNameSingularCapitalised } =
        formatTableName(references);
      // TODO: add relation to other table using addToPrismaModel
      return `${tableNameSingular} ${tableNameSingularCapitalised}${
        notNull ? "" : "?"
      } @relation(fields: [${tableNameSingular}Id], references: [id]${
        cascade ? ", onDelete: Cascade" : ""
      })\n  ${tableNameSingular}Id String`;
    },
    DateTime: ({ name, notNull }) =>
      `${toCamelCase(name)} DateTime${notNull ? "" : "?"}`,
    Json: ({ name, notNull }) =>
      `${toCamelCase(name)} Json${notNull ? "" : "?"}`,
    Decimal: ({ name, notNull }) =>
      `${toCamelCase(name)} Decimal${notNull ? "" : "?"}`,
  },
} as TypeMap;

export const createOrmMappings = () => {
  const { provider } = readConfigFile();
  return {
    drizzle: {
      pg: {
        tableFunc: "pgTable",
        typeMappings: {
          id: ({ name }) => `serial("${name}").primaryKey()`,
          varchar: ({ name }) => `varchar("${name}", { length: 256 })`,
          text: ({ name }) => `text("${name}")`,
          number: ({ name }) => `integer("${name}")`,
          float: ({ name }) => `real("${name}")`,
          boolean: ({ name }) => `boolean("${name}")`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "number",
          }) =>
            `${getReferenceFieldType(referenceIdType)["pg"]}("${name}"${
              referenceIdType === "string" ? ", { length: 256 }" : ""
            }).references(() => ${referencedTable}.id${
              cascade ? ', { onDelete: "cascade" }' : ""
            })`,
          // Add more types here as needed
          timestamp: ({ name }) => `timestamp("${name}")`,
          date: ({ name }) => `date("${name}")`,
          json: ({ name }) => `json("${name}")`,
        },
      },
      mysql: {
        tableFunc: "mysqlTable",
        typeMappings: {
          id: ({ name }) => `serial("${name}").primaryKey()`,
          varchar: ({ name }) => `varchar("${name}", { length: 256 })`,
          text: ({ name }) => `text("${name}")`,
          number: ({ name }) => `int("${name}")`,
          float: ({ name }) => `real("${name}")`,
          boolean: ({ name }) => `boolean("${name}")`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "number",
          }) =>
            `${getReferenceFieldType(referenceIdType)["mysql"]}("${name}"${
              referenceIdType === "string" ? ", { length: 256 }" : ""
            })${
              provider === "planetscale"
                ? ""
                : `.references(() => ${toCamelCase(referencedTable)}.id${
                    cascade ? ', { onDelete: "cascade" }' : ""
                  })`
            }`,
          date: ({ name }) => `date("${name}")`,
          timestamp: ({ name }) => `timestamp("${name}")`,
          json: ({ name }) => `json("${name}")`,
        },
      },
      sqlite: {
        tableFunc: "sqliteTable",
        typeMappings: {
          id: ({ name }) => `integer("${name}").primaryKey()`,
          string: ({ name }) => `text("${name}")`,
          number: ({ name }) => `integer("${name}")`,
          boolean: ({ name }) => `integer("${name}", { mode: "boolean" })`,
          references: ({
            name,
            references: referencedTable = "REFERENCE",
            cascade,
            referenceIdType = "number",
          }) =>
            `${
              getReferenceFieldType(referenceIdType)["sqlite"]
            }("${name}").references(() => ${toCamelCase(referencedTable)}.id${
              cascade ? ', { onDelete: "cascade" }' : ""
            })`,
          date: ({ name }) => `integer("${name}", { mode: "timestamp" })`,
          timestamp: ({ name }) =>
            `integer("${name}", { mode: "timestamp_ms" })`,
          blob: ({ name }) => `blob("${name}")`,
        },
      },
    },
    prisma: {
      pg: prismaMappings,
      mysql: prismaMappings,
      sqlite: prismaMappings,
    },
  } as ORMTypeMap;
};

export const generateAuthCheck = (belongsToUser: boolean) => {
  return belongsToUser ? "\n  const { session } = await getUserAuth();" : "";
};

export const authForWhereClausePrisma = (belongsToUser: boolean) => {
  return belongsToUser ? ", userId: session?.user.id!" : "";
};
