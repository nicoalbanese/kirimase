import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { consola } from "consola";
import { DBField, DBType, FieldType } from "../../types.js";
import { Choice } from "@inquirer/checkbox";
import { createConfig, scaffoldModel } from "./generators/model.js";
import { scaffoldAPIRoute } from "./generators/apiRoute.js";
import { readConfigFile } from "../../utils.js";
import { scaffoldTRPCRoute } from "./generators/trpcRoute.js";
import { addPackage } from "../add/index.js";
import { initProject } from "../init/index.js";
import { Schema } from "./types.js";

function provideInstructions() {
  consola.info(
    "Use Kirimase scaffold to quickly generate your Model (drizzle-schema), View (React components), and Controllers (API Routes and TRPC Routes)"
  );
}

async function askForResourceType() {
  const resourcesRequested = await checkbox({
    message: "Please select the resources you would like to generate:",
    choices: [
      { name: "Model", value: "model" },
      { name: "API Route", value: "api_route" },
      { name: "TRPC Route", value: "trpc_route" },
      { name: "Views", value: "views", disabled: "Coming soon!" },
    ],
  });
  return resourcesRequested;
}

async function askForTable() {
  const tableName = await input({
    message: "Please enter the table name (plural and in snake_case):",
    validate: (input) =>
      input.match(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)
        ? true
        : "Table name must be in snake_case if more than one word, and plural.",
  });
  return tableName;
}

async function askIfBelongsToUser() {
  const belongsToUser = await confirm({
    message: "Does this model belong to the user?",
    default: true,
  });
  return belongsToUser;
}

async function askForFields(dbType: DBType) {
  const fields: DBField[] = [];
  let addMore = true;

  while (addMore) {
    const fieldType = (await select({
      message: "Please select the type of this field:",
      choices: Object.keys(createConfig()[dbType].typeMappings)
        .filter((field) => field !== "id")
        .map((field) => {
          return { name: field, value: field };
        }),
    })) as FieldType;

    if (fieldType === "references") {
      const referencesTable = await input({
        message:
          "Which table does it reference? (in snake_case if more than one word)",
      });

      const fieldName = `${referencesTable.slice(0, -1)}_id`;
      const cascade = await confirm({
        message: "Would you like to cascade on delete?",
        default: false,
      });

      fields.push({
        name: fieldName,
        type: fieldType,
        references: referencesTable,
        notNull: true,
        cascade,
      });
    } else {
      const fieldName = await input({
        message: "Please enter the field name (in snake_case):",
        validate: (input) =>
          input.match(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)
            ? true
            : "Field name must be in snake_case if more than one word.",
      });

      const notNull = await confirm({
        message: "Is this field required?",
        default: true,
      });

      fields.push({ name: fieldName.toLowerCase(), type: fieldType, notNull });
    }

    const continueAdding = await confirm({
      message: "Would you like to add another field?",
      default: true,
    });

    addMore = continueAdding;
  }

  return fields;
}

async function askForIndex(fields: DBField[]) {
  const useIndex = await confirm({
    message: "Would you like to set up an index?",
    default: false,
  });

  if (useIndex) {
    const fieldToIndex = await select({
      message: "Which field would you like to index?",
      choices: fields.map((field) => {
        return {
          name: field.name,
          value: field.name,
        } as Choice<string>;
      }),
    });
    return fieldToIndex;
  } else {
    return null;
  }
}

export async function buildSchema() {
  const config = readConfigFile();

  if (config) {
    const { driver, hasSrc, packages } = config;

    if (packages.includes("drizzle")) {
      provideInstructions();
      const resourceType = await askForResourceType();
      const tableName = await askForTable();
      const fields = await askForFields(driver);
      const indexedField = await askForIndex(fields);
      // console.log(indexedField);
      let schema: Schema;
      if (resourceType.includes("model") && packages.includes("next-auth")) {
        const belongsToUser = await askIfBelongsToUser();
        schema = {
          tableName,
          fields,
          index: indexedField,
          belongsToUser,
        };
      } else {
        schema = {
          tableName,
          fields,
          index: indexedField,
          belongsToUser: false,
        };
      }

      if (resourceType.includes("model")) scaffoldModel(schema, driver, hasSrc);
      if (resourceType.includes("api_route")) scaffoldAPIRoute(schema);
      if (resourceType.includes("trpc_route")) scaffoldTRPCRoute(schema);
      // if (resourceType.includes("views")) scaffoldModel()

      // console.log("Schema:", schema);
      // You can now pass this schema object to the scaffoldResource function
    } else {
      consola.warn(
        "You need to have drizzle installed in order to use the scaffold command."
      );
      addPackage();
    }
  } else {
    consola.warn("You need to have a config file in order to use generate.");
    initProject();
  }
}
