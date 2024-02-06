import { ORMType } from "../../../../../types.js";
import { ExtendedSchema, Schema } from "../../../types.js";
import { generateQueries } from "./generators.js";

export const generateQueryContent = (schema: ExtendedSchema, orm: ORMType) => {
  const relations = schema.fields.filter(
    (field) => field.type.toLowerCase() === "references"
  );

  const imports = generateQueries[orm].imports(schema, relations);
  const getQuery = generateQueries[orm].get(schema, relations);
  const getByIdQuery = generateQueries[orm].getById(schema, relations);
  const getByIdWithChildren =
    schema.children && schema.children.length > 0
      ? generateQueries[orm].getByIdWithChildren(schema, relations)
      : "";

  return `${imports}
${getQuery}
${getByIdQuery}
${getByIdWithChildren}
`;
};
