import { DBType, ORMType } from "../../../../../types.js";
import { Schema } from "../../../types.js";
import { generateMutations } from "./generators.js";

export const generateMutationContent = (
  schema: Schema,
  driver: DBType,
  orm: ORMType
) => {
  const imports = generateMutations[orm].imports(schema);
  const createMutation = generateMutations[orm].create(schema, driver);
  const updateMutation = generateMutations[orm].update(schema, driver);
  const deleteMutation = generateMutations[orm].delete(schema, driver);

  return `${imports}
${createMutation}
${updateMutation}
${deleteMutation}
`;
};
