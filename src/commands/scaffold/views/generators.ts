// TODOS
// # Components
// [ ] Item Component
// [ ] CreateItemForm Component (maybe a modal?)
// -----
// # Routes
// [ ] Index Route
// [ ] [:id] Index Route
// [ ] [:id] Edit Route
// [ ] New Route

import { ScaffoldSchema } from "../../../types.js";

export const generateItemComponentContent = (schema: ScaffoldSchema) => {
  const { fields } = schema;

  return `




`;
};

export const generateCreateItemFormComponentContent = (
  schema: ScaffoldSchema
) => {
  const { fields } = schema;
};

export const generateIndexRouteContent = (schema: ScaffoldSchema) => {
  const { tableName, fields } = schema;
};

export const generateDynamicIndexRouteContent = (schema: ScaffoldSchema) => {
  const { tableName, fields } = schema;
};

export const generateDynamicEditRouteContent = (schema: ScaffoldSchema) => {
  const { tableName, fields } = schema;
};

export const generateNewItemRouteContent = (schema: ScaffoldSchema) => {
  const { tableName, fields } = schema;
};
