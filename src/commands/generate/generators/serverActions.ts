import { createFile } from "../../../utils.js";
import { formatFilePath } from "../../filePaths/index.js";
import { Schema } from "../types.js";
import { formatTableName } from "../utils.js";

export const scaffoldServerActions = async (schema: Schema) => {
  const { tableName } = schema;
  const { tableNameCamelCase } = formatTableName(tableName);
  const path = formatFilePath(`lib/actions/${tableNameCamelCase}.ts`, {
    prefix: "rootPath",
    removeExtension: false,
  });
  await createFile(path, generateRouteContent(schema));
};

const generateRouteContent = (schema: Schema) => {
  const { tableName } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameCamelCase,
    tableNamePluralCapitalised,
    tableNameKebabCase,
  } = formatTableName(tableName);

  const template = `"use server";

import { revalidatePath } from "next/cache";
import {
  create${tableNameSingularCapitalised},
  delete${tableNameSingularCapitalised},
  update${tableNameSingularCapitalised},
} from "${formatFilePath(`lib/api/${tableNameCamelCase}/mutations.ts`, {
    prefix: "alias",
    removeExtension: true,
  })}";
import {
  ${tableNameSingularCapitalised}Id,
  New${tableNameSingularCapitalised}Params,
  Update${tableNameSingularCapitalised}Params,
  ${tableNameSingular}IdSchema,
  insert${tableNameSingularCapitalised}Params,
  update${tableNameSingularCapitalised}Params,
} from "${formatFilePath(`lib/db/schema/${tableNameCamelCase}.ts`, {
    removeExtension: true,
    prefix: "alias",
  })}";

const handleErrors = (e: unknown) => {
  const errMsg = "Error, please try again.";
  if (e instanceof Error) return e.message.length > 0 ? e.message : errMsg;
  if (e && typeof e === "object" && "error" in e) {
    const errAsStr = e.error as string;
    return errAsStr.length > 0 ? errAsStr : errMsg;
  }
  return errMsg;
};

const revalidate${tableNamePluralCapitalised} = () => revalidatePath("/${tableNameKebabCase}");

export const create${tableNameSingularCapitalised}Action = async (input: New${tableNameSingularCapitalised}Params) => {
  try {
    const payload = insert${tableNameSingularCapitalised}Params.parse(input);
    await create${tableNameSingularCapitalised}(payload);
    revalidate${tableNamePluralCapitalised}();
  } catch (e) {
    return handleErrors(e);
  }
};

export const update${tableNameSingularCapitalised}Action = async (input: Update${tableNameSingularCapitalised}Params) => {
  try {
    const payload = update${tableNameSingularCapitalised}Params.parse(input);
    await update${tableNameSingularCapitalised}(payload.id, payload);
    revalidate${tableNamePluralCapitalised}();
  } catch (e) {
    return handleErrors(e);
  }
};

export const delete${tableNameSingularCapitalised}Action = async (input: ${tableNameSingularCapitalised}Id) => {
  try {
    const payload = ${tableNameSingular}IdSchema.parse({ id: input });
    await delete${tableNameSingularCapitalised}(payload.id);
    revalidate${tableNamePluralCapitalised}();
  } catch (e) {
    return handleErrors(e);
  }
};`;
  return template;
};
