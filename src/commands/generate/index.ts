import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { consola } from "consola";
import { DBField, FieldType } from "../../types.js";
import { Choice } from "@inquirer/checkbox";
import { scaffoldModel } from "./generators/model.js";
import { scaffoldController } from "./generators/controller.js";
import { readConfigFile } from "../../utils.js";

function provideInstructions() {
  consola.info(
    "Use Kirimase scaffold to quickly generate your Model (drizzle-schema), View (React components), and Controllers (API Routes)"
  );
}

async function askForResourceType() {
  const resourcesRequested = await checkbox({
    message: "Please select the resources you would like to generate:",
    choices: [
      { name: "Model", value: "model" },
      { name: "API Route", value: "controller" },
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

async function askForFields() {
  const fields: DBField[] = [];
  let addMore = true;

  while (addMore) {
    const fieldType = (await select({
      message: "Please select the type of this field:",
      choices: [
        { name: "string", value: "string" },
        { name: "number", value: "number" },
        { name: "boolean", value: "boolean" },
        { name: "relation (references)", value: "references" },
        { name: "timestamp", value: "timestamp" },
        { name: "date", value: "date" },
      ],
    })) as FieldType;

    if (fieldType === "references") {
      const referencesTable = await input({
        message:
          "Which table does it reference? (in snake_case if more than one word)",
      });

      const fieldName = `${referencesTable.slice(0, -1)}_id`;

      fields.push({
        name: fieldName,
        type: fieldType,
        references: referencesTable,
        notNull: true,
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
        default: false,
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
  const { driver, hasSrc } = readConfigFile();
  provideInstructions();
  const resourceType = await askForResourceType();
  const tableName = await askForTable();
  const fields = await askForFields();
  const indexedField = await askForIndex(fields);
  // console.log(indexedField);

  const schema = {
    tableName,
    fields,
    index: indexedField,
  };

  if (resourceType.includes("model")) scaffoldModel(schema, driver, hasSrc);
  if (resourceType.includes("controller")) scaffoldController(schema);
  // if (resourceType.includes("views")) scaffoldModel()

  // console.log("Schema:", schema);
  // You can now pass this schema object to the scaffoldResource function
}
