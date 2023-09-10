import { ORMType } from "../../../../../types.js";
import { Schema } from "../../../types.js";
import { generateQueries } from "./generators.js";

export const generateQueryContent = (schema: Schema, orm: ORMType) => {
  const relations = schema.fields.filter(
    (field) => field.type.toLowerCase() === "references"
  );

  const imports = generateQueries[orm].imports(schema, relations);
  const getQuery = generateQueries[orm].get(schema, relations);
  const getByIdQuery = generateQueries[orm].getById(schema, relations);

  return `${imports}
${getQuery}
${getByIdQuery}
`;
};
