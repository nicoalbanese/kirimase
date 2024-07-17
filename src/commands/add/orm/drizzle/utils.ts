import { existsSync, readFileSync } from "fs";
import { createFile, readConfigFile, replaceFile } from "../../../../utils.js";
import { consola } from "consola";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export async function addToDrizzleModel(
  modelName: string,
  attributesToAdd: string,
  additionalImports?: string[]
) {
  const { rootPath } = readConfigFile();
  const modelToSearch =
    modelName === "auth" || modelName === "users" ? "auth" : modelName;
  const pathToModel = rootPath.concat(`lib/db/schema/${modelToSearch}.ts`);
  const hasSchema = existsSync(pathToModel);
  if (!hasSchema) {
    console.error(`${modelName} schema not found!`);
    return;
  }
  const schema = readFileSync(pathToModel, "utf-8");
  if (schema.includes(modelName)) {
    // Find the start and end positions of the specified model
    const { modelEnd } = getDrizzleModelStartAndEnd(schema, modelName);
    // Split the schema and insert the attributes at the right position
    const beforeModelEnd = schema.substring(0, modelEnd);
    const afterModelEnd = schema.substring(modelEnd);

    const newSchema =
      beforeModelEnd + "  " + attributesToAdd + "\n" + afterModelEnd;
    const newSchemaWithUpdatedImports = newSchema.replace(
      '} from "drizzle-orm',
      `${additionalImports.map((i) => `, ${i}`)} } from "drizzle-orm`
    );
    await replaceFile(pathToModel, newSchemaWithUpdatedImports);
    consola.info("Updated Drizzle schema");
  }
}

const getDrizzleModelStartAndEnd = (schema: string, modelName: string) => {
  const modelStart = schema.indexOf(`export const ${modelName}`);
  let modelExists = true;
  if (modelStart === -1) {
    modelExists = false;
  }
  const modelEnd = schema.indexOf("});", modelStart);
  if (modelEnd === -1) {
    modelExists = false;
  }
  return { modelStart, modelEnd, modelExists };
};

export const addNanoidToUtils = async () => {
  const nanoidContent = `import { customAlphabet } from "nanoid";
export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");`;
  const { shared } = getFilePaths();
  const utilsPath = formatFilePath(shared.init.libUtils, {
    removeExtension: false,
    prefix: "rootPath",
  });
  const utilsExists = existsSync(utilsPath);
  if (!utilsExists) {
    await createFile(utilsPath, nanoidContent);
  } else {
    const utilsContent = readFileSync(utilsPath, "utf-8");
    const newContent = `${nanoidContent.split("\n")[0].trim()}
${utilsContent}
${nanoidContent.split("\n")[1].trim()}
`;
    await replaceFile(utilsPath, newContent);
  }
};

export const checkTimestampsInUtils = async () => {
  const timestampsContent = `export const timestamps: { createdAt: true; updatedAt: true } = {
  createdAt: true,
  updatedAt: true,
};
`;
  const { shared } = getFilePaths();
  const utilsPath = formatFilePath(shared.init.libUtils, {
    removeExtension: false,
    prefix: "rootPath",
  });
  const utilsExists = existsSync(utilsPath);
  if (!utilsExists) {
    await createFile(utilsPath, timestampsContent);
  } else {
    const utilsContent = readFileSync(utilsPath, "utf-8");
    if (utilsContent.indexOf(timestampsContent) === -1) {
      const newContent = `${utilsContent}
  ${timestampsContent}
  `;
      await replaceFile(utilsPath, newContent);
    }
  }
};
