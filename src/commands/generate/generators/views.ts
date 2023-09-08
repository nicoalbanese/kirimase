import { DBField } from "../../../types.js";
import {
  createFile,
  getFileContents,
  installShadcnUIComponents,
  readConfigFile,
} from "../../../utils.js";
import { addPackage } from "../../add/index.js";
import { Schema } from "../types.js";
import {
  defaultValueMappings,
  formatTableName,
  toCamelCase,
  toNormalEnglish,
} from "../utils.js";

export const scaffoldViewsAndComponents = (schema: Schema) => {
  const { hasSrc, packages } = readConfigFile();
  const { tableNameCamelCase, tableNameSingularCapitalised } = formatTableName(
    schema.tableName
  );
  // require trpc for these views
  if (packages.includes("trpc") && packages.includes("shadcn-ui")) {
    // create view - tableName/page.tsx
    const rootPath = hasSrc ? "src/" : "";
    createFile(
      rootPath.concat(`app/${tableNameCamelCase}/page.tsx`),
      generateView(schema)
    );
    // create components/tableName/TableNameList.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}List.tsx`
      ),
      createListComponent(schema)
    );
    // create components/tableName/TableNameForm.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}Form.tsx`
      ),
      createFormComponent(schema)
    );
    // create components/tableName/TableNameModal.tsx
    createFile(
      rootPath.concat(
        `components/${tableNameCamelCase}/${tableNameSingularCapitalised}Modal.tsx`
      ),
      createModalComponent(schema)
    );
    // install shadcn packages (button, dialog, form, input, label) - exec script: pnpm dlx shadcn-ui@latest add _
    const baseComponents = ["button", "dialog", "form", "input", "label"];
    schema.fields.filter((field) => field.type === "boolean").length > 0
      ? baseComponents.push("checkbox")
      : null;
    schema.fields.filter((field) => field.type === "references").length > 0
      ? baseComponents.push("select")
      : null;
    schema.fields.filter(
      (field) => field.type === "date" || field.type === "timestamp"
    ).length > 0
      ? baseComponents.push("popover", "calendar")
      : null;
    installShadcnUIComponents(baseComponents);
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
  return `import ${tableNameSingularCapitalised}List from "@/components/${tableNameCamelCase}/${tableNameSingularCapitalised}List";
import New${tableNameSingularCapitalised}Modal from "@/components/${tableNameCamelCase}/${tableNameSingularCapitalised}Modal";
import { get${tableNameCapitalised} } from "@/lib/api/${tableNameCamelCase}/queries";${
    schema.belongsToUser
      ? '\nimport { checkAuth } from "@/lib/auth/utils";'
      : ""
  }

export default async function ${tableNameCapitalised}() {
  ${
    schema.belongsToUser ? "await checkAuth();\n  " : ""
  }const { ${tableNameCamelCase} } = await get${tableNameCapitalised}();  

  return (
    <main className="max-w-3xl mx-auto p-5 md:p-0 sm:pt-4">
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
  const { hasSrc } = readConfigFile();
  const path = `${hasSrc ? "src/" : ""}lib/api/${tableName}/queries.ts`;
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
    tableNameNormalEnglishCapitalised,
  } = formatTableName(schema.tableName);
  const relations = schema.fields.filter(
    (field) => field.type === "references"
  );

  return `"use client";
import { Complete${tableNameSingularCapitalised} } from "@/lib/db/schema/${tableNameCamelCase}";
import { trpc } from "@/lib/trpc/client";
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
    schema.fields[0].type === "date" || schema.fields[0].type === "timestamp"
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
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No ${tableNameNormalEnglishSingularLowerCase}</h3>
      <p className="mt-1 text-sm text-gray-500">
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
  if (field.type == "boolean")
    return `<br />
            <FormControl>
              <Checkbox {...field} checked={!!field.value} onCheckedChange={field.onChange} value={""} />
            </FormControl>`;
  if (field.type == "references") {
    const referencesSingular = field.references.slice(0, -1);
    const entity = queryHasJoins(toCamelCase(field.references))
      ? `${referencesSingular}.${referencesSingular}`
      : referencesSingular;
    return `<FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ${referencesSingular}" />
                  </SelectTrigger>
                  <SelectContent>
                    {${field.references}?.${field.references}.map((${referencesSingular}) => (
                      <SelectItem key={${entity}.id} value={${entity}.id.toString()}>
                        {${entity}.id}  {/* TODO: Replace with a field from the ${referencesSingular} model */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </FormControl>
`;
  }
  if (field.type == "date" || field.type == "timestamp")
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
    tableNameFirstChar,
    tableNameNormalEnglishSingular,
  } = formatTableName(schema.tableName);
  const { packages, driver } = readConfigFile();
  const relations = schema.fields.filter(
    (field) => field.type === "references"
  );

  return `"use client";

import { ${tableNameSingularCapitalised}, New${tableNameSingularCapitalised}Params, insert${tableNameSingularCapitalised}Params } from "@/lib/db/schema/${tableNameCamelCase}";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { Button } from "../ui/button";
import { z } from "zod";${
    schema.fields.filter((field) => field.type === "boolean").length > 0
      ? '\nimport { Checkbox } from "../ui/checkbox";'
      : ""
  }${
    relations.length > 0
      ? '\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";'
      : ""
  }${
    schema.fields.filter(
      (field) => field.type === "date" || field.type === "timestamp"
    ).length > 0
      ? `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";`
      : ""
  }
import { useRouter } from "next/navigation";${
    packages.includes("shadcn-ui")
      ? `\nimport { useToast } from "@/components/ui/use-toast";`
      : ""
  }

const ${tableNameSingularCapitalised}Form = ({
  ${tableNameSingular},
  closeModal,
}: {
  ${tableNameSingular}?: ${tableNameSingularCapitalised};
  closeModal: () => void;
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
            }`
        )
        .join(",\n     ")}
    },
  });

  const onSuccess = (${
    packages.includes("shadcn-ui")
      ? 'action: "create" | "update" | "delete"'
      : ""
  }) => {
    utils.${tableNameCamelCase}.get${tableNameCapitalised}.invalidate();
    router.refresh();
    closeModal();${
      packages.includes("shadcn-ui")
        ? `toast({
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
        packages.includes("shadcn-ui") ? ': () => onSuccess("create")' : ""
      },
    });

  const { mutate: update${tableNameSingularCapitalised}, isLoading: isUpdating } =
    trpc.${tableNameCamelCase}.update${tableNameSingularCapitalised}.useMutation({
      onSuccess${
        packages.includes("shadcn-ui") ? ': () => onSuccess("update")' : ""
      },
    });

  const { mutate: delete${tableNameSingularCapitalised}, isLoading: isDeleting } =
    trpc.${tableNameCamelCase}.delete${tableNameSingularCapitalised}.useMutation({
      onSuccess${
        packages.includes("shadcn-ui") ? ': () => onSuccess("delete")' : ""
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
        />`
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
  return `"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ${tableNameSingularCapitalised}Form from "./${tableNameSingularCapitalised}Form";
import { ${tableNameSingularCapitalised} } from "@/lib/db/schema/${tableNameCamelCase}";

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
