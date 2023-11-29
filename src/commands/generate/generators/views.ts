import { DBField } from "../../../types.js";
import pluralize from "pluralize";
import {
  createFile,
  getFileContents,
  installShadcnUIComponents,
  readConfigFile,
} from "../../../utils.js";
import { addPackage } from "../../add/index.js";
import { formatFilePath, getFilePaths } from "../../filePaths/index.js";
import { Schema } from "../types.js";
import {
  defaultValueMappings,
  formatTableName,
  toCamelCase,
  toNormalEnglish,
} from "../utils.js";

export const scaffoldViewsAndComponents = async (schema: Schema) => {
  const { hasSrc, packages } = readConfigFile();
  const {
    tableNameCamelCase,
    tableNameSingularCapitalised,
    tableNameKebabCase,
  } = formatTableName(schema.tableName);
  // require trpc for these views
  if (packages.includes("trpc") && packages.includes("shadcn-ui")) {
    // create view - tableName/page.tsx
    const rootPath = hasSrc ? "src/" : "";
    createFile(
      rootPath.concat(`app/${tableNameKebabCase}/page.tsx`),
      generateView(schema),
    );
    // create components/tableName/TableNameList.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}List.tsx`,
      ),
      createListComponent(schema),
    );
    // create components/tableName/TableNameForm.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}Form.tsx`,
      ),
      createFormComponent(schema),
    );
    // create components/tableName/TableNameModal.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}Modal.tsx`,
      ),
      createModalComponent(schema),
    );
    // install shadcn packages (button, dialog, form, input, label) - exec script: pnpm dlx shadcn-ui@latest add _
    // const baseComponents = ["button", "dialog", "form", "input", "label"];
    const baseComponents = ["dialog", "form"];
    schema.fields.filter((field) => field.type === "boolean").length > 0
      ? baseComponents.push("checkbox")
      : null;
    schema.fields.filter((field) => field.type.toLowerCase() === "references")
      .length > 0
      ? baseComponents.push("select")
      : null;
    schema.fields.filter(
      (field) =>
        field.type === "date" ||
        field.type === "timestamp" ||
        field.type === "DateTime",
    ).length > 0
      ? baseComponents.push("popover", "calendar")
      : null;
    await installShadcnUIComponents(baseComponents);
  } else {
    addPackage();
  }
};

const generateView = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingularCapitalised,
    tableNameCapitalised,
    tableNameNormalEnglishCapitalised,
  } = formatTableName(schema.tableName);
  const { shared, trpc } = getFilePaths();
  const { alias } = readConfigFile();

  return `import ${tableNameSingularCapitalised}List from "${alias}/components/${tableNameCamelCase}/${tableNameSingularCapitalised}List";
import New${tableNameSingularCapitalised}Modal from "${alias}/components/${tableNameCamelCase}/${tableNameSingularCapitalised}Modal";
import { api } from "${formatFilePath(trpc.trpcApiTs, {
    prefix: "alias",
    removeExtension: true,
  })}";${
    schema.belongsToUser
      ? `\nimport { checkAuth } from "${formatFilePath(shared.auth.authUtils, {
          prefix: "alias",
          removeExtension: true,
        })}";`
      : ""
  }

export default async function ${tableNameCapitalised}() {
  ${
    schema.belongsToUser ? "await checkAuth();\n  " : ""
  }const { ${tableNameCamelCase} } = await api.${tableNameCamelCase}.get${tableNameCapitalised}.query();  

  return (
    <main className="max-w-3xl mx-auto p-4 rounded-lg bg-card">
      <div className="flex justify-between">
        <h1 className="font-semibold text-2xl my-2">${tableNameNormalEnglishCapitalised}</h1>
        <New${tableNameSingularCapitalised}Modal />
      </div>
      <${tableNameSingularCapitalised}List ${tableNameCamelCase}={${tableNameCamelCase}} />
    </main>
  );
}
`;
};

const queryHasJoins = (tableName: string) => {
  // const { hasSrc } = readConfigFile();
  const { shared } = getFilePaths();
  const path = `${formatFilePath(shared.orm.servicesDir, {
    prefix: "rootPath",
    removeExtension: false,
  })}/${tableName}/queries.ts`;
  const queryContent = getFileContents(path);
  return queryContent.includes("Join");
};

const createListComponent = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCapitalised,
    tableNameFirstChar,
    tableNameNormalEnglishSingularLowerCase,
    tableNameNormalEnglishLowerCase,
  } = formatTableName(schema.tableName);
  const relations = schema.fields.filter(
    (field) => field.type === "references",
  );
  const { t3 } = readConfigFile();
  const { shared, trpc } = getFilePaths();

  return `"use client";
import { Complete${tableNameSingularCapitalised} } from "${formatFilePath(
    shared.orm.schemaDir,
    { prefix: "alias", removeExtension: false },
  )}/${tableNameCamelCase}";
import { ${t3 ? "api as " : ""}trpc } from "${formatFilePath(trpc.trpcClient, {
    prefix: "alias",
    removeExtension: true,
  })}";
import ${tableNameSingularCapitalised}Modal from "./${tableNameSingularCapitalised}Modal";


export default function ${tableNameSingularCapitalised}List({ ${tableNameCamelCase} }: { ${tableNameCamelCase}: Complete${tableNameSingularCapitalised}[] }) {
  const { data: ${tableNameFirstChar} } = trpc.${tableNameCamelCase}.get${tableNameCapitalised}.useQuery(undefined, {
    initialData: { ${tableNameCamelCase} },
    refetchOnMount: false,
  });

  if (${tableNameFirstChar}.${tableNameCamelCase}.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul>
      {${tableNameFirstChar}.${tableNameCamelCase}.map((${tableNameSingular}) => (
        <${tableNameSingularCapitalised} ${tableNameSingular}={${tableNameSingular}} key={${
          relations.length > 0
            ? `${tableNameSingular}.${tableNameSingular}`
            : tableNameSingular
        }.id} />
      ))}
    </ul>
  );
}

const ${tableNameSingularCapitalised} = ({ ${tableNameSingular} }: { ${tableNameSingular}: Complete${tableNameSingularCapitalised} }) => {
  return (
    <li className="flex justify-between my-2">
      <div className="w-full">
        <div>{${
          relations.length > 0
            ? `${tableNameSingular}.${tableNameSingular}`
            : tableNameSingular
        }.${toCamelCase(schema.fields[0].name)}${
          schema.fields[0].type === "date" ||
          schema.fields[0].type === "timestamp" ||
          schema.fields[0].type === "DateTime"
            ? ".toString()"
            : ""
        }}</div>
      </div>
      <${tableNameSingularCapitalised}Modal ${tableNameSingular}={${
        relations.length > 0
          ? `${tableNameSingular}.${tableNameSingular}`
          : tableNameSingular
      }} />
    </li>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center">
      <h3 className="mt-2 text-sm font-semibold text-secondary-foreground">
        No ${tableNameNormalEnglishLowerCase}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by creating a new ${tableNameNormalEnglishSingularLowerCase}.
      </p>
      <div className="mt-6">
        <${tableNameSingularCapitalised}Modal emptyState={true} />
      </div>
    </div>
  );
};

`;
};

const createformInputComponent = (field: DBField): string => {
  if (field.type.toLowerCase() == "boolean")
    return `<br />
            <FormControl>
              <Checkbox {...field} checked={!!field.value} onCheckedChange={field.onChange} value={""} />
            </FormControl>`;
  if (field.type.toLowerCase() == "references") {
    const referencesSingular = pluralize.singular(
      toCamelCase(field.references),
    );
    const { tableNameNormalEnglishSingularLowerCase } = formatTableName(
      field.references,
    );
    const entity = queryHasJoins(toCamelCase(field.references))
      ? `${referencesSingular}.${referencesSingular}`
      : referencesSingular;
    const referencesPlural = toCamelCase(field.references);
    return `<FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ${tableNameNormalEnglishSingularLowerCase}" />
                  </SelectTrigger>
                  <SelectContent>
                    {${referencesPlural}?.${referencesPlural}.map((${referencesSingular}) => (
                      <SelectItem key={${entity}.id} value={${entity}.id.toString()}>
                        {${entity}.id}  {/* TODO: Replace with a field from the ${referencesSingular} model */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </FormControl>
`;
  }
  if (
    field.type == "date" ||
    field.type == "timestamp" ||
    field.type == "DateTime"
  )
    return `<br />
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(field.value)}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
`;
  return `<FormControl>
            <Input {...field} />
          </FormControl>
`;
};

const generateTrpcGetQuery = (referenceTable: string) => {
  const { tableNameCamelCase, tableNameCapitalised } =
    formatTableName(referenceTable);
  return `const { data: ${tableNameCamelCase} } = trpc.${tableNameCamelCase}.get${tableNameCapitalised}.useQuery();`;
};

const createFormComponent = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCapitalised,
    tableNameNormalEnglishSingular,
  } = formatTableName(schema.tableName);
  const { packages, driver, alias, t3 } = readConfigFile();
  const relations = schema.fields.filter(
    (field) => field.type.toLowerCase() === "references",
  );
  const { shared, trpc } = getFilePaths();

  return `"use client";

import { ${tableNameSingularCapitalised}, New${tableNameSingularCapitalised}Params, insert${tableNameSingularCapitalised}Params } from "${formatFilePath(
    shared.orm.schemaDir,
    { prefix: "alias", removeExtension: false },
  )}/${tableNameCamelCase}";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "${alias}/components/ui/form";
import { Input } from "${alias}/components/ui/input";
import { ${t3 ? "api as " : ""}trpc } from "${formatFilePath(trpc.trpcClient, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { Button } from "${alias}/components/ui/button";
import { z } from "zod";${
    schema.fields.filter((field) => field.type.toLowerCase() === "boolean")
      .length > 0
      ? `\nimport { Checkbox } from "${alias}/components/ui/checkbox";`
      : ""
  }${
    relations.length > 0
      ? `\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "${alias}/components/ui/select";`
      : ""
  }${
    schema.fields.filter(
      (field) =>
        field.type === "date" ||
        field.type === "timestamp" ||
        field.type === "DateTime",
    ).length > 0
      ? `import { Popover, PopoverContent, PopoverTrigger } from "${alias}/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "${alias}/components/ui/calendar";
import { cn } from "${formatFilePath(shared.init.libUtils, {
          prefix: "alias",
          removeExtension: true,
        })}";
import { format } from "date-fns";`
      : ""
  }
import { useRouter } from "next/navigation";${
    packages.includes("shadcn-ui")
      ? `\nimport { useToast } from "${alias}/components/ui/use-toast";`
      : ""
  }

const ${tableNameSingularCapitalised}Form = ({
  ${tableNameSingular},
  closeModal,
}: {
  ${tableNameSingular}?: ${tableNameSingularCapitalised};
  closeModal?: () => void;
}) => {${
    packages.includes("shadcn-ui") ? `\n  const { toast } = useToast();` : ""
  }
  ${
    relations.length > 0
      ? relations
          .map((relation) => generateTrpcGetQuery(relation.references))
          .join("\n  ")
      : ""
  }
  const editing = !!${tableNameSingular}?.id;

  const router = useRouter();
  const utils = trpc.useContext();

  const form = useForm<z.infer<typeof insert${tableNameSingularCapitalised}Params>>({
    // latest Zod release has introduced a TS error with zodResolver
    // open issue: https://github.com/colinhacks/zod/issues/2663
    // errors locally but not in production
    resolver: zodResolver(insert${tableNameSingularCapitalised}Params),
    defaultValues: ${tableNameSingular} ?? {
      ${schema.fields
        .map(
          (field) =>
            `${toCamelCase(field.name)}: ${
              defaultValueMappings[driver][field.type]
            }`,
        )
        .join(",\n     ")}
    },
  });

  const onSuccess = async (${
    packages.includes("shadcn-ui")
      ? 'action: "create" | "update" | "delete",\n'
      : ""
  }    data?: { error?: string },
  ) => {
        if (data?.error) {
      toast({
        title: \`\${action
          .slice(0, 1)
          .toUpperCase()
          .concat(action.slice(1))} Failed\`,
        description: data.error,
        variant: "destructive",
      });
      return;
    }

    await utils.${tableNameCamelCase}.get${tableNameCapitalised}.invalidate();
    router.refresh();
    if (closeModal) closeModal();${
      packages.includes("shadcn-ui")
        ? `\n        toast({
      title: 'Success',
      description: \`${tableNameNormalEnglishSingular} \${action}d!\`,
      variant: "default",
    });`
        : null
    }
  };

  const { mutate: create${tableNameSingularCapitalised}, isLoading: isCreating } =
    trpc.${tableNameCamelCase}.create${tableNameSingularCapitalised}.useMutation({
      onSuccess${
        packages.includes("shadcn-ui")
          ? ': (res) => onSuccess("create", res)'
          : ""
      },
    });

  const { mutate: update${tableNameSingularCapitalised}, isLoading: isUpdating } =
    trpc.${tableNameCamelCase}.update${tableNameSingularCapitalised}.useMutation({
      onSuccess${
        packages.includes("shadcn-ui")
          ? ': (res) => onSuccess("update", res)'
          : ""
      },
    });

  const { mutate: delete${tableNameSingularCapitalised}, isLoading: isDeleting } =
    trpc.${tableNameCamelCase}.delete${tableNameSingularCapitalised}.useMutation({
      onSuccess${
        packages.includes("shadcn-ui")
          ? ': (res) => onSuccess("delete", res)'
          : ""
      },
    });

  const handleSubmit = (values: New${tableNameSingularCapitalised}Params) => {
    if (editing) {
      update${tableNameSingularCapitalised}({ ...values, id: ${tableNameSingular}.id });
    } else {
      create${tableNameSingularCapitalised}(values);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={"space-y-8"}>
        ${schema.fields
          .map(
            (field) => `<FormField
          control={form.control}
          name="${toCamelCase(field.name)}"
          render={({ field }) => (<FormItem>
              <FormLabel>${toNormalEnglish(field.name)}</FormLabel>
                ${createformInputComponent(field)}
              <FormMessage />
            </FormItem>
          )}
        />`,
          )
          .join("\n        ")}
        <Button
          type="submit"
          className="mr-1"
          disabled={isCreating || isUpdating}
        >
          {editing
            ? \`Sav\${isUpdating ? "ing..." : "e"}\`
            : \`Creat\${isCreating ? "ing..." : "e"}\`}
        </Button>
        {editing ? (
          <Button
            type="button"
            variant={"destructive"}
            onClick={() => delete${tableNameSingularCapitalised}({ id: ${tableNameSingular}.id })}
          >
            Delet{isDeleting ? "ing..." : "e"}
          </Button>
        ) : null}
      </form>
    </Form>
  );
};

export default ${tableNameSingularCapitalised}Form;
`;
};

export const createModalComponent = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameNormalEnglishSingular,
  } = formatTableName(schema.tableName);
  const { alias } = readConfigFile();
  const { shared } = getFilePaths();
  return `"use client";

import { useState } from "react";
import { Button } from "${alias}/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ${tableNameSingularCapitalised}Form from "./${tableNameSingularCapitalised}Form";
import { ${tableNameSingularCapitalised} } from "${formatFilePath(
    shared.orm.schemaDir,
    { prefix: "alias", removeExtension: false },
  )}/${tableNameCamelCase}";

export default function ${tableNameSingularCapitalised}Modal({ 
  ${tableNameSingular},
  emptyState,
}: { 
  ${tableNameSingular}?: ${tableNameSingularCapitalised};
  emptyState?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const editing = !!${tableNameSingular}?.id;
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
      { emptyState ? (
          <Button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New ${tableNameNormalEnglishSingular}
          </Button>
        ) : (
        <Button
          variant={editing ? "ghost" : "outline"}
          size={editing ? "sm" : "icon"}
        >
          {editing ? "Edit" : "+"}
        </Button> )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{ editing ? "Edit" : "Create" } ${tableNameNormalEnglishSingular}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5">
          <${tableNameSingularCapitalised}Form closeModal={closeModal} ${tableNameSingular}={${tableNameSingular}} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
`;
};
