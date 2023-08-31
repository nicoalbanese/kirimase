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
