import { DBField, FieldType } from "../../types.js";
import { Schema } from "./types.js";

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

export function capitaliseForZodSchema(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1, -1);
}

export const formatTableName = (tableName: string) => {
  const tableNameCamelCase = toCamelCase(tableName);
  const tableNameCapitalised =
    tableNameCamelCase.charAt(0).toUpperCase() + tableNameCamelCase.slice(1);
  const tableNameSingularCapitalised =
    capitaliseForZodSchema(tableNameCamelCase);
  const tableNameSingular = tableNameCamelCase.slice(0, -1);
  const tableNameFirstChar = tableNameCamelCase.charAt(0);

  return {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameFirstChar,
    tableNameCapitalised,
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

const excludedTypes: Array<FieldType> = ["text", "string", "varchar"];

export const getNonStringFields = (fields: DBField[]) => {
  return fields.filter((field) => !excludedTypes.includes(field.type));
};

type ZodType = "string" | "number" | "boolean" | "date" | "bigint" | "object";

const ZodMappings: Partial<Record<FieldType, ZodType>> = {
  number: "number",
  date: "date",
  boolean: "boolean",
  float: "number",
  references: "number",
  timestamp: "date",
  json: "object",
};

export const getZodMappings = (fields: DBField[]) => {
  return fields.map((field) => {
    const zodType = ZodMappings[field.type];
    return {
      name: field.name,
      type: zodType,
    };
  });
};
