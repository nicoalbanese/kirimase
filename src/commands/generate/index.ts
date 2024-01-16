import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { consola } from "consola";
import pluralize from "pluralize";
import {
  DBField,
  DBType,
  DrizzleColumnType,
  ORMType,
  PrismaColumnType,
} from "../../types.js";
import { Choice } from "@inquirer/checkbox";
import { createOrmMappings } from "./generators/model/utils.js";
import { scaffoldAPIRoute } from "./generators/apiRoute.js";
import { readConfigFile, updateConfigFileAfterUpdate } from "../../utils.js";
import { scaffoldTRPCRoute } from "./generators/trpcRoute.js";
import { addPackage } from "../add/index.js";
import { initProject } from "../init/index.js";
import { Schema } from "./types.js";
import { scaffoldViewsAndComponents } from "./generators/views.js";
import {
  camelCaseToSnakeCase,
  getCurrentSchemas,
  toCamelCase,
} from "./utils.js";
import { scaffoldModel } from "./generators/model/index.js";
import { scaffoldServerActions } from "./generators/serverActions.js";
import { scaffoldViewsAndComponentsWithServerActions } from "./generators/views-with-server-actions.js";
import { addLinkToSidebar } from "./generators/model/views-shared.js";

function provideInstructions() {
  consola.info(
    "Quickly generate your Model (Drizzle schema + queries / mutations), Controllers (API Routes and TRPC Routes), and Views"
  );
}

type TResource =
  | "model"
  | "api_route"
  | "trpc_route"
  | "views_and_components_trpc"
  | "views_and_components_server_actions"
  | "server_actions";

type TResourceGroup = "model" | "controller" | "view";

async function askForResourceType() {
  const { packages, orm } = readConfigFile();

  //   const resourcesRequested = (await checkbox({
  //     message: "Please select the resources you would like to generate:",
  //     choices: [
  //       {
  //         name: "Model",
  //         value: "model",
  //         disabled:
  //           orm === null
  //             ? "[You need to have an orm installed. Run 'kirimase add']"
  //             : false,
  //       },
  //       { name: "API Route", value: "api_route" },
  //       {
  //         name: "TRPC Route",
  //         value: "trpc_route",
  //         disabled: !packages.includes("trpc")
  //           ? "[You need to have trpc installed. Run 'kirimase add']"
  //           : false,
  //       },
  //       {
  //         name: "Views + Components (with Shadcn UI, requires TRPC route)",
  //         value: "views_and_components_trpc",
  //         disabled:
  //           !packages.includes("shadcn-ui") || !packages.includes("trpc")
  //             ? "[You need to have shadcn-ui and trpc installed. Run 'kirimase add']"
  //             : false,
  //       },
  //       {
  //         name: "Server Actions",
  //         value: "server_actions",
  //       },
  //       {
  //         name: "Views + Components (with server actions)",
  //         value: "views_and_components_server_actions",
  //       },
  //     ],
  //   })) as TResource[];
  //   return resourcesRequested;
  // }

  let resourcesRequested: TResource[] = [];
  let viewRequested: TResource;
  let controllersRequested: TResource[];
  const resourcesTypesRequested = (await checkbox({
    message: "Please select the resources you would like to generate:",
    choices: [
      {
        name: "Model",
        value: "model",
        disabled:
          orm === null
            ? "[You need to have an orm installed. Run 'kirimase add']"
            : false,
      },
      { name: "Controller", value: "controller" },
      {
        name: "View",
        value: "view",
        disabled: !packages.includes("shadcn-ui")
          ? "[You need to have shadcn-ui installed. Run 'kirimase add']"
          : false,
      },
    ],
  })) as TResourceGroup[];

  if (resourcesTypesRequested.includes("model"))
    resourcesRequested.push("model");

  if (resourcesTypesRequested.includes("view")) {
    viewRequested = (await select({
      message: "Please select the type of view you would like to generate:",
      choices: [
        {
          name: "Server Actions with Optimistic UI",
          value: "views_and_components_server_actions",
        },
        {
          name: "tRPC with React Hook Form",
          value: "views_and_components_trpc",
          disabled: !packages.includes("trpc")
            ? "[You need to have tRPC installed. Run 'kirimase add']"
            : false,
        },
      ],
    })) as TResource;
    if (
      viewRequested === "views_and_components_server_actions" &&
      resourcesTypesRequested.includes("controller")
    )
      resourcesRequested.push("server_actions");
    if (
      viewRequested === "views_and_components_trpc" &&
      resourcesTypesRequested.includes("controller")
    )
      resourcesRequested.push("trpc_route");
  }

  if (resourcesTypesRequested.includes("controller")) {
    controllersRequested = (await checkbox({
      message: viewRequested
        ? "Please select any additional controllers you would like to generate:"
        : "Please select which controllers you would like to generate:",
      choices: [
        {
          name: "Server Actions",
          value: "server_actions",
          disabled:
            viewRequested === "views_and_components_server_actions"
              ? "[Already generated with your selected view]"
              : false,
        },
        {
          name: "API Route",
          value: "api_route",
        },
        {
          name: "tRPC",
          value: "trpc_route",
          disabled: !packages.includes("trpc")
            ? "[You need to have tRPC installed. Run 'kirimase add']"
            : viewRequested === "views_and_components_trpc"
              ? "[Already generated with your selected view]"
              : false,
        },
      ].filter((item) =>
        viewRequested ? !viewRequested.includes(item.value.split("_")[0]) : item
      ),
    })) as TResource[];
  }

  viewRequested && resourcesRequested.push(viewRequested);
  controllersRequested && resourcesRequested.push(...controllersRequested);

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

async function askForFields(orm: ORMType, dbType: DBType, tableName: string) {
  const fields: DBField[] = [];
  let addMore = true;

  while (addMore) {
    const currentSchemas = getCurrentSchemas();

    const baseFieldTypeChoices = Object.keys(
      createOrmMappings()[orm][dbType].typeMappings
    )
      .filter((field) => field !== "id")
      .map((field) => {
        return { name: field.toLowerCase(), value: field };
      });

    const removeReferenceOption =
      currentSchemas.length === 0 ||
      (currentSchemas.length === 1 &&
        currentSchemas[0] === toCamelCase(tableName));
    const fieldTypeChoices = removeReferenceOption
      ? baseFieldTypeChoices.filter(
          (field) => field.name.toLowerCase() !== "references"
        )
      : baseFieldTypeChoices;

    const fieldType = (await select({
      message: "Please select the type of this field:",
      choices: fieldTypeChoices,
    })) as DrizzleColumnType | PrismaColumnType;

    if (fieldType.toLowerCase() === "references") {
      const referencesTable = await select({
        message: "Which table do you want it reference?",
        choices: currentSchemas
          .filter((schema) => schema !== toCamelCase(tableName))
          .map((schema) => {
            return {
              name: camelCaseToSnakeCase(schema),
              value: camelCaseToSnakeCase(schema),
            };
          }),
      });

      const fieldName = `${pluralize.singular(referencesTable)}_id`;
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

export function preBuild() {
  const config = readConfigFile();

  if (!config) {
    consola.warn("You need to have a config file in order to use generate.");
    initProject();
    return false;
  }

  if (config.orm === undefined) updateConfigFileAfterUpdate();
  return true;
}

export async function buildSchema() {
  const ready = preBuild();

  if (!ready) return;

  const config = readConfigFile();

  const { driver, hasSrc, orm, auth } = config;

  if (orm !== null) {
    provideInstructions();
    const resourceType = await askForResourceType();
    const tableName = await askForTable();
    const fields = await askForFields(orm, driver, tableName);
    const indexedField = await askForIndex(fields);
    let schema: Schema;
    if (resourceType.includes("model") && auth !== null) {
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

    if (
      resourceType.includes("views_and_components_trpc") ||
      resourceType.includes("views_and_components_server_actions")
    ) {
      const addToSidebar = await confirm({
        message:
          "Would you like to add a link to this new entity in your sidebar?",
        default: true,
      });
      if (addToSidebar) addLinkToSidebar(tableName);
    }

    if (resourceType.includes("model")) scaffoldModel(schema, driver, hasSrc);
    if (resourceType.includes("api_route")) scaffoldAPIRoute(schema);
    if (resourceType.includes("trpc_route")) scaffoldTRPCRoute(schema);
    if (resourceType.includes("views_and_components_trpc"))
      scaffoldViewsAndComponents(schema);
    if (resourceType.includes("server_actions")) scaffoldServerActions(schema);
    if (resourceType.includes("views_and_components_server_actions"))
      scaffoldViewsAndComponentsWithServerActions(schema);
  } else {
    consola.warn(
      "You need to have an ORM installed in order to use the scaffold command."
    );
    addPackage();
  }
}
