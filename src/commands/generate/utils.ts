import path from "path";
import pluralize from "pluralize";
import { z } from "zod";
import {
  DBField,
  DBType,
  DrizzleColumnType,
  PrismaColumnType,
} from "../../types.js";
import {
  mysqlColumns,
  pgColumns,
  prismaColumns,
  readConfigFile,
  replaceFile,
  sqliteColumns,
} from "../../utils.js";
import fs, { existsSync, readFileSync } from "fs";
import { consola } from "consola";
import { formatFilePath, getFilePaths } from "../filePaths/index.js";
import { Schema } from "./types.js";

import chalk from "chalk";
import { TResource } from "./index.js";
import { createNextStepsList, createNotesList } from "../add/utils.js";

export function toCamelCase(input: string): string {
  return input
    .toLowerCase()
    .split("_")
    .map((word, index) => {
      if (index === 0) return word; // Return the first word as is
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the first letter of the rest
    })
    .join("");
}

export function snakeToKebab(snakeString: string): string {
  return snakeString.replace(/_/g, "-");
}

export function capitalise(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function camelCaseToSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

export function capitaliseForZodSchema(input: string): string {
  const singularInput = pluralize.singular(input);
  return singularInput.charAt(0).toUpperCase() + singularInput.slice(1);
}

export const formatTableName = (tableName: string) => {
  const tableNameCamelCase = tableName.includes("_")
    ? toCamelCase(tableName)
    : tableName;
  const tableNameCapitalised =
    tableNameCamelCase.charAt(0).toUpperCase() + tableNameCamelCase.slice(1);
  const tableNameSingularCapitalised =
    capitaliseForZodSchema(tableNameCamelCase);
  const tableNameSingular = pluralize.singular(tableNameCamelCase);
  const tableNamePlural = pluralize.plural(tableNameCamelCase);
  const tableNamePluralCapitalised =
    tableNamePlural.charAt(0).toUpperCase() + tableNamePlural.slice(1);
  const tableNameFirstChar = tableNameCamelCase.charAt(0);
  const tableNameNormalEnglishCapitalised = toNormalEnglish(
    tableName,
    false,
    false
  );
  const tableNameNormalEnglishSingular = toNormalEnglish(
    tableName,
    false,
    true
  );
  const tableNameNormalEnglishSingularLowerCase = toNormalEnglish(
    tableName,
    true,
    true
  );

  const tableNameNormalEnglishLowerCase = toNormalEnglish(
    tableName,
    true,
    false
  );
  const tableNameKebabCase = snakeToKebab(tableName);

  return {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNamePluralCapitalised,
    tableNameFirstChar,
    tableNameCapitalised,
    tableNameNormalEnglishCapitalised,
    tableNameNormalEnglishSingular,
    tableNameNormalEnglishLowerCase,
    tableNameNormalEnglishSingularLowerCase,
    tableNameKebabCase,
  };
};

export type ReferenceType = "string" | "number";
export const getReferenceFieldType = (type: ReferenceType) => {
  return {
    pg: type === "string" ? "varchar" : "integer",
    mysql: type === "string" ? "varchar" : "int",
    sqlite: type === "string" ? "text" : "integer",
  };
};

const excludedTypes: Array<DrizzleColumnType | PrismaColumnType> = [
  "text",
  "string",
  "varchar",
  "String",
];

export const getNonStringFields = (fields: DBField[]) => {
  return fields.filter((field) => !excludedTypes.includes(field.type));
};

type ZodType = "string" | "number" | "boolean" | "date" | "bigint" | "object";

const DrizzleToZodMappings: Record<
  DBType,
  Partial<Record<DrizzleColumnType, ZodType>>
> = {
  pg: {
    number: "number",
    date: "string",
    boolean: "boolean",
    float: "number",
    references: "string",
    timestamp: "string",
    // json: "object",
  },
  mysql: {
    number: "number",
    date: "string",
    boolean: "boolean",
    float: "number",
    references: "string",
    timestamp: "string",
    // json: "object",
  },
  sqlite: {
    number: "number",
    date: "date",
    boolean: "boolean",
    float: "number",
    references: "string",
    timestamp: "date",
    // json: "object",
  },
};

const PrismaToZodMappings: Record<PrismaColumnType, ZodType> = {
  Int: "number",
  Float: "number",
  Decimal: "number",
  String: "string",
  Boolean: "boolean",
  DateTime: "date",
  BigInt: "bigint",
  // Json: "object",
  References: "string",
};

export type ZodMapping = { name: string; type: ZodType };

export const getZodMappings = (fields: DBField[]) => {
  const { driver, orm } = readConfigFile();
  if (orm === "drizzle") {
    return fields.map((field) => {
      const zodType = DrizzleToZodMappings[driver][field.type];
      return {
        name: field.name,
        type: zodType,
      };
    });
  } else if (orm === "prisma") {
    return fields.map((field) => {
      const zodType = PrismaToZodMappings[field.type];
      return {
        name: field.name,
        type: zodType as ZodType,
      };
    });
  }
};

export const defaultValueMappings: Record<
  DBType,
  Partial<Record<DrizzleColumnType | PrismaColumnType, string>>
> = {
  pg: {
    string: '""',
    number: "0",
    boolean: "false",
    // blob: '""',
    date: '""',
    // json: '""',
    text: '""',
    float: "0.0",
    varchar: '""',
    timestamp: '""',
    references: '""',
    Int: "0",
    // Json: '""',
    DateTime: "new Date()",
    Boolean: "false",
    String: '""',
    Float: "0.0",
    Decimal: "0.0",
    BigInt: "0",
    References: '""',
  },
  mysql: {
    string: '""',
    number: "0",
    boolean: "false",
    // blob: '""',
    date: '""',
    // json: '""',
    text: '""',
    float: "0.0",
    varchar: '""',
    timestamp: '""',
    references: '""',
    Int: "0",
    // Json: '""',
    DateTime: "new Date()",
    Boolean: "false",
    String: '""',
    Float: "0.0",
    Decimal: "0.0",
    BigInt: "0",
    References: '""',
  },
  sqlite: {
    string: '""',
    number: "0",
    boolean: "false",
    // blob: '""',
    date: "new Date()",
    // json: '""',
    text: '""',
    float: "0.0",
    varchar: '""',
    timestamp: "new Date()",
    references: '""',
    Int: "0",
    // Json: '""',
    DateTime: "new Date()",
    Boolean: "false",
    String: '""',
    Float: "0.0",
    Decimal: "0.0",
    BigInt: "0",
    References: '""',
  },
};

export function toNormalEnglish(
  input: string,
  lowercase?: boolean,
  singular?: boolean
): string {
  const output = input
    .split("_")
    .map((word) => capitalise(word))
    .join(" ");

  const newOutput = singular ? pluralize.singular(output) : output;

  return lowercase ? newOutput.toLowerCase() : newOutput;
}

export function getCurrentSchemas() {
  const { hasSrc, orm } = readConfigFile();
  const { shared } = getFilePaths();
  if (orm === "drizzle") {
    const directory = formatFilePath(shared.orm.schemaDir, {
      removeExtension: false,
      prefix: "rootPath",
    });

    try {
      // Read the directory content
      const files = fs.readdirSync(directory);

      // Filter and transform to get only .ts files and remove their extensions
      const schemaNames = files
        .filter((file) => path.extname(file) === ".ts")
        .map((file) => path.basename(file, ".ts"));

      return schemaNames.filter(
        (schema) => schema !== "auth" && schema !== "_root"
      );
    } catch (error) {
      // console.error(`Error reading schemas ${directory}:`, error);
      return [];
    }
  }
  if (orm === "prisma") {
    const schemaPath = "prisma/schema.prisma";
    const schemaExists = existsSync(schemaPath);
    if (schemaExists) {
      const schemaContents = readFileSync(schemaPath, "utf-8");
      const excludedSchemas = [
        "User",
        "Session",
        "VerificationToken",
        "Account",
        "",
        "Key",
      ];
      const schemaNames = schemaContents
        .split("\n")
        .filter((line) => line.includes("model") && line.includes("{"))
        .map((line) => line.split(" ")[1])
        .filter((item) => !excludedSchemas.includes(item))
        .map((item) =>
          pluralize.plural(`${item[0].toLowerCase()}${item.slice(1)}`)
        );
      return schemaNames;
    } else {
      consola.info(`Prisma schema file does not exist`);
      return [];
    }
  }
}

export const addToPrismaSchema = (schema: string, modelName: string) => {
  const schemaPath = "prisma/schema.prisma";
  const schemaExists = existsSync(schemaPath);
  if (schemaExists) {
    const schemaContents = readFileSync(schemaPath, "utf-8");
    // write logic to check if model already exists -> if so replace
    const { modelStart, modelEnd, modelExists } = getPrismaModelStartAndEnd(
      schemaContents,
      modelName
    );

    if (modelExists) {
      const newContent =
        schemaContents.slice(0, modelStart) +
        schema +
        schemaContents.slice(modelEnd + 1);
      replaceFile(schemaPath, newContent);
      // consola.success(`Replaced ${modelName} in Prisma schema`);
    } else {
      const newContent = schemaContents.concat("\n", schema);
      replaceFile(schemaPath, newContent);
      // consola.success(`Added ${modelName} to Prisma schema`);
    }
  } else {
    consola.info(`Prisma schema file does not exist`);
  }
};

export const formatPrismaModelName = (name: string) => {
  const lowerCase = name.toLowerCase();
  const firstLetter = lowerCase[0];
  const plural = pluralize.plural(name);
  const pluralLowerCase = pluralize.plural(lowerCase);

  return {
    lowerCase,
    firstLetter,
    plural,
    pluralLowerCase,
  };
};

const getPrismaModelStartAndEnd = (schema: string, modelName: string) => {
  const modelStart = schema.indexOf(`model ${modelName} {`);
  let modelExists = true;
  if (modelStart === -1) {
    modelExists = false;
  }
  const modelEnd = schema.indexOf("}", modelStart);
  if (modelEnd === -1) {
    modelExists = false;
  }
  return { modelStart, modelEnd, modelExists };
};

export function addToPrismaModel(modelName: string, attributesToAdd: string) {
  const hasSchema = existsSync("prisma/schema.prisma");
  if (!hasSchema) {
    console.error("Prisma schema not found!");
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  if (
    !schema.includes(attributesToAdd.split(" ")[1]) &&
    schema.includes(modelName)
  ) {
    // Find the start and end positions of the specified model
    const { modelEnd } = getPrismaModelStartAndEnd(schema, modelName);
    // Split the schema and insert the attributes at the right position
    const beforeModelEnd = schema.substring(0, modelEnd);
    const afterModelEnd = schema.substring(modelEnd);

    const newSchema =
      beforeModelEnd + "  " + attributesToAdd + "\n" + afterModelEnd;
    replaceFile("prisma/schema.prisma", newSchema);
    consola.info("Updated Prisma schema");
  }
}

export function addToPrismaModelBulk(
  modelName: string,
  attributesToAdd: string
) {
  const hasSchema = existsSync("prisma/schema.prisma");
  if (!hasSchema) {
    console.error("Prisma schema not found!");
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  if (schema.includes(modelName)) {
    // Find the start and end positions of the specified model
    const { modelEnd } = getPrismaModelStartAndEnd(schema, modelName);
    // Split the schema and insert the attributes at the right position
    const beforeModelEnd = schema.substring(0, modelEnd);
    const afterModelEnd = schema.substring(modelEnd);

    const newSchema =
      beforeModelEnd + "  " + attributesToAdd + "\n" + afterModelEnd;
    replaceFile("prisma/schema.prisma", newSchema);
    consola.info("Updated Prisma schema");
  }
}

const resourceMapping: Record<TResource, string> = {
  model: "Model (schema file and queries/mutations functions)",
  views_and_components_server_actions: "Views (powered by Server Actions)",
  server_actions: "Server Actions",
  api_route: "API Route",
  trpc_route: "tRPC Route",
  views_and_components_trpc: "Views (powered by tRPC)",
};

export const printGenerateNextSteps = (
  schemas: Schema[],
  resources: TResource[]
) => {
  const config = readConfigFile();
  const { resourceNames, resourceEndpoints } = schemas.reduce(
    (acc, schema) => {
      const { tableNameNormalEnglishSingular, tableNameKebabCase } =
        formatTableName(schema.tableName);
      acc.resourceNames.push(tableNameNormalEnglishSingular);
      acc.resourceEndpoints.push(tableNameKebabCase);
      return acc;
    },
    { resourceNames: [], resourceEndpoints: [] }
  );

  const ppm = config?.preferredPackageManager ?? "npm";
  const dbMigration = [
    ...(config.t3 === true ? [] : [`Run \`${ppm} run db:generate\``]),
    `Run \`${ppm} run db:${config.driver === "pg" ? "migrate" : "push"}\``,
  ];

  const viewInBrowser = [
    `Run \`${ppm} run dev\``,
    `Open the following URLs in your browser:\n${resourceEndpoints
      .map((endpoint) => `👉 http://localhost:3000/${endpoint}`)
      .join("\n")}`,
  ];

  const nextStepsList = [
    ...(resources.includes("model") ? dbMigration : []),
    ...(resources.includes("views_and_components_trpc") ||
    resources.includes("views_and_components_server_actions")
      ? viewInBrowser
      : []),
  ];

  consola.box(`🎉 Success! 

Kirimase generated the following resources for \`${resourceNames.join(",")}\`:
${resources.map((r) => `- ${resourceMapping[r]}`).join("\n")}

${createNextStepsList(nextStepsList)}

${createNotesList([
  "If you run into any issues, please create an issue on GitHub\n  (https://github.com/nicoalbanese/kirimase/issues)",
  "Documentation (https://kirimase.dev/commands/generate)",
])}`);
};

export const validateSchemas = (schemas: Schema[]) => {
  const validationSchema: z.ZodSchema<any> = z.lazy(() =>
    z.object({
      tableName: z
        .string()
        .regex(
          /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
          "Table name must be in snake_case if more than one word, and plural."
        ),
      fields: z.array(
        z.object({
          name: z
            .string()
            .regex(
              /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
              "Field name must be in snake_case if more than one word."
            ),
          type: z.enum([
            ...new Set([
              ...pgColumns,
              ...mysqlColumns,
              ...sqliteColumns,
              ...prismaColumns,
            ]),
          ] as [string, ...string[]]),
          notNull: z.boolean(),
        })
      ),
      index: z.union([z.string(), z.null()]),
      belongsToUser: z.boolean(),
      includeTimestamps: z.boolean(),
      children: z.array(validationSchema),
    })
  );

  return validationSchema.array().parse(schemas);
};

// Pull only relevant field based on a given Zod issue path
function getInvalidSchemaFieldFromIssuePath(path: (string | number)[]) {
  let fieldNamePath = [];

  const lastPart = path[path.length - 1];
  const fieldProperties: (keyof DBField)[] = [
    "name",
    "type",
    "references",
    "notNull",
    "cascade",
  ];
  // If the invalid field is from the "fields" property, we want to also log
  // the "fields" property and the index.
  // For example "fields.0.name"
  if (
    typeof lastPart === "string" &&
    fieldProperties.includes(lastPart as keyof DBField)
  ) {
    fieldNamePath.push("fields");
    fieldNamePath.push(path[path.length - 2]); // field property index
  }
  fieldNamePath.push(lastPart);

  return fieldNamePath.join(".");
}

// Build schema tableName path based on a given Zod issue path
function getSchemaTableNamePathFromIssuePath(
  schemas: Schema[],
  path: (string | number)[]
) {
  let currentSchema: Schema;
  let currentSchemas: Schema[] = schemas;
  let tableNamePath = [];

  for (let i = 0; i < path.length; i++) {
    const part = path[i];
    const isIndex = !isNaN(Number(part));

    if (isIndex) {
      const index = Number(part);
      currentSchema = currentSchemas[index];
    } else {
      const fieldName = part;
      tableNamePath.push(currentSchema.tableName);
      if (fieldName === "children") {
        currentSchemas = currentSchema.children;
      } else {
        break;
      }
    }
  }

  return tableNamePath.join(".");
}

export const formatSchemaValidationError = (
  error: z.ZodError,
  schemas: Schema[]
) => {
  const formattedError = error.issues.map((issue) => {
    return {
      message: issue.message,
      field: getInvalidSchemaFieldFromIssuePath(issue.path),
      tableName: getSchemaTableNamePathFromIssuePath(schemas, issue.path),
    };
  });
  return JSON.stringify(formattedError, null, 2);
};
