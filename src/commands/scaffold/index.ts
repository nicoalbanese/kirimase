import { confirm, input, select } from "@inquirer/prompts";
import { Choice } from "@inquirer/checkbox";
import { DBField, FieldType } from "../../types.js";
import { consola } from "consola";
import { scaffoldResource } from "./generatorRouter.js";

function provideInstructions() {
  consola.info(
    "Use Kirimase scaffold to quickly generate your Model (drizzle-schema), View (React components), and Controllers (API Routes)"
  );
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
    const fieldName = await input({
      message: "Please enter the field name (in snake_case):",
      validate: (input) =>
        input.match(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/)
          ? true
          : "Field name must be in snake_case if more than one word.",
    });

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

      fields.push({
        name: fieldName,
        type: fieldType,
        references: referencesTable,
      });
    } else {
      fields.push({ name: fieldName, type: fieldType });
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
  provideInstructions();
  const tableName = await askForTable();
  const fields = await askForFields();
  const indexedField = await askForIndex(fields);
  console.log(indexedField);

  const schema = {
    tableName,
    fields,
    index: indexedField,
  };

  console.log("Schema:", schema);
  scaffoldResource(schema);
  // You can now pass this schema object to the scaffoldResource function
}
