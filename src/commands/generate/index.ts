import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { consola } from "consola";
import pluralize from "pluralize";
import {
  Config,
  DBField,
  DBType,
  DrizzleColumnType,
  ORMType,
  PrismaColumnType,
} from "../../types.js";
import { Choice } from "@inquirer/checkbox";
import { createOrmMappings } from "./generators/model/utils.js";
import { scaffoldAPIRoute } from "./generators/apiRoute.js";
import {
  readConfigFile,
  sendEvent,
  updateConfigFileAfterUpdate,
} from "../../utils.js";
import { scaffoldTRPCRoute } from "./generators/trpcRoute.js";
import { addPackage, spinner } from "../add/index.js";
import { initProject } from "../init/index.js";
import { ExtendedSchema, Schema } from "./types.js";
import { scaffoldViewsAndComponents } from "./generators/views.js";
import {
  camelCaseToSnakeCase,
  formatTableName,
  getCurrentSchemas,
  printGenerateNextSteps,
  toCamelCase,
} from "./utils.js";
import { scaffoldModel } from "./generators/model/index.js";
import { scaffoldServerActions } from "./generators/serverActions.js";
import { scaffoldViewsAndComponentsWithServerActions } from "./generators/views-with-server-actions.js";
import { addLinkToSidebar } from "./generators/model/views-shared.js";
import { installShadcnComponentList } from "../add/utils.js";

function provideInstructions() {
  consola.info(
    "Quickly generate your Model (schema + queries / mutations), Controllers (API Routes and TRPC Routes), and Views"
  );
}

export type TResource =
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
      default: false,
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

async function askForTimestamps() {
  return await confirm({
    message: "Would you like timestamps (createdAt, updatedAt)?",
    default: true,
  });
}

async function askForChildModel(parentModel: string) {
  return await confirm({
    message: `Would you like to add a child model? (${parentModel})`,
    default: false,
  });
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

async function promptUserForSchema(config: Config, resourceType: TResource[]) {
  const tableName = await askForTable();
  const fields = await askForFields(config.orm, config.driver, tableName);
  const indexedField = await askForIndex(fields);
  const includeTimestamps = await askForTimestamps();
  let belongsToUser: boolean = false;
  if (resourceType.includes("model") && config.auth !== null) {
    belongsToUser = await askIfBelongsToUser();
  }
  return {
    tableName,
    fields,
    index: indexedField,
    belongsToUser,
    includeTimestamps,
  } as Schema;
}

// Create a new function to handle the recursion
async function addChildSchemaToParent(
  config: Config,
  resourceType: TResource[],
  parentSchema: Schema
): Promise<Schema> {
  const childModels: Schema[] = [];
  let addChild = await askForChildModel(parentSchema.tableName);
  while (addChild) {
    const childSchema = await getSchema(config, resourceType); // recursive call instead of getBaseSchema
    childModels.push(childSchema);
    addChild = await askForChildModel(parentSchema.tableName); // ask again if they want to add another child
  }

  return {
    ...parentSchema,
    children: childModels,
  } as Schema;
}

async function getSchema(
  config: Config,
  resourceType: TResource[]
): Promise<Schema> {
  const baseSchema = await promptUserForSchema(config, resourceType);
  if (resourceType.includes("views_and_components_trpc")) return baseSchema;
  return await addChildSchemaToParent(config, resourceType, baseSchema);
}

function getInidividualSchemas(
  schema: Schema,
  parents: string[] = [],
  result: ExtendedSchema[] = []
) {
  // Add the main schema entity to the result array
  const config = readConfigFile();
  const { tableName, children, fields, ...mainSchema } = schema;
  const newParents = [...parents, tableName];
  const immediateParent = parents[parents.length - 1];

  const parentRelationField: DBField[] =
    immediateParent === undefined
      ? []
      : [
          {
            name: `${pluralize.singular(immediateParent)}_id`,
            type: config.orm === "prisma" ? "References" : "references",
            cascade: true,
            references: immediateParent,
            notNull: true,
          },
        ];

  result.push({
    ...mainSchema,
    tableName,
    parents,
    children,
    fields: [...fields, ...parentRelationField],
  });

  // If there are child schemas, recursively call getSchemas() on each one
  if (Array.isArray(children)) {
    children.forEach((child) =>
      getInidividualSchemas(child, newParents, result)
    );
  }

  return result;
}

export const formatSchemaForGeneration = (schema?: Schema) => {
  return getInidividualSchemas(schema);
};

const anonymiseSchemas = (schemas: ExtendedSchema[]): ExtendedSchema[] => {
  const anonymise = (
    schema: ExtendedSchema,
    prefix: string
  ): ExtendedSchema => {
    return {
      ...schema,
      tableName: `${prefix}Table`,
      parents: schema.parents
        ? schema.parents.map((_, i) => `${prefix}Parent${i + 1}`)
        : [],
      children: schema.children
        ? schema.children.map((c, i) =>
            anonymise(c as ExtendedSchema, `${prefix}Child${i + 1}`)
          )
        : [],
      fields: schema.fields.map((f, i) => ({
        ...f,
        name: `${prefix}Field${i + 1}`,
        references: ``,
      })),
    };
  };

  return schemas.map((s, i) => anonymise(s, `Schema${i + 1}`));
};

async function generateResources(
  schema: ExtendedSchema,
  resourceType: TResource[]
) {
  const config = readConfigFile();
  const { tableNameNormalEnglishCapitalised: tnEnglish } = formatTableName(
    schema.tableName
  );

  if (
    (resourceType.includes("views_and_components_trpc") ||
      resourceType.includes("views_and_components_server_actions")) &&
    !config.t3
  ) {
    const addToSidebar = await confirm({
      message: `Would you like to add a link to '${tnEnglish}' in your sidebar?`,
      default: true,
    });
    if (addToSidebar) addLinkToSidebar(schema.tableName);
  }

  if (resourceType.includes("model"))
    scaffoldModel(schema, config.driver, config.hasSrc);
  if (resourceType.includes("api_route")) scaffoldAPIRoute(schema);
  if (resourceType.includes("trpc_route")) scaffoldTRPCRoute(schema);
  if (resourceType.includes("views_and_components_trpc"))
    scaffoldViewsAndComponents(schema);
  if (resourceType.includes("server_actions")) scaffoldServerActions(schema);
  if (resourceType.includes("views_and_components_server_actions"))
    scaffoldViewsAndComponentsWithServerActions(schema);
  await installShadcnComponentList();
}

export async function buildSchema() {
  const ready = preBuild();
  if (!ready) return;

  const config = readConfigFile();

  if (config.orm !== null) {
    provideInstructions();
    const resourceType = await askForResourceType();
    const schema = await getSchema(config, resourceType);
    // would want to have something that formatted the schema object into:
    // an array of items that needed to be created using code commented below
    // would also need extra stuff like urls
    // TODO

    const schemas = formatSchemaForGeneration(schema);

    await sendEvent("generate", {
      schemas: JSON.stringify(anonymiseSchemas(schemas)),
      resources: resourceType,
    });

    for (let schema of schemas) {
      await generateResources(schema, resourceType);
    }
    printGenerateNextSteps(schema, resourceType);
  } else {
    consola.warn(
      "You need to have an ORM installed in order to use the scaffold command."
    );
    addPackage();
  }
}
