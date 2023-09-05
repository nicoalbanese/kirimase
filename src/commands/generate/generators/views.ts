import {
  createFile,
  installShadcnUIComponents,
  readConfigFile,
} from "../../../utils.js";
import { addPackage } from "../../add/index.js";
import { addTrpc } from "../../add/trpc/index.js";
import { Schema } from "../types.js";
import {
  capitalise,
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
    <main className="max-w-3xl mx-auto p-5 sm:p-0 sm:pt-4">
      <div className="flex justify-between">
        <h1 className="font-semibold text-2xl my-2">${tableNameCapitalised}</h1>
        <New${tableNameSingularCapitalised}Modal />
      </div>
      <${tableNameSingularCapitalised}List ${tableNameCamelCase}={${tableNameCamelCase}} />
    </main>
  );
}
`;
};

const createListComponent = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCapitalised,
    tableNameFirstChar,
  } = formatTableName(schema.tableName);

  return `"use client";
import { ${tableNameSingularCapitalised} } from "@/lib/db/schema/${tableNameCamelCase}";
import { trpc } from "@/lib/trpc/client";
import ${tableNameSingularCapitalised}Modal from "./${tableNameSingularCapitalised}Modal";


export default function ${tableNameSingularCapitalised}List({ ${tableNameCamelCase} }: { ${tableNameCamelCase}: ${tableNameSingularCapitalised}[] }) {
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
        <${tableNameSingularCapitalised} ${tableNameSingular}={${tableNameSingular}} key={${tableNameSingular}.id} />
      ))}
    </ul>
  );
}

const ${tableNameSingularCapitalised} = ({ ${tableNameSingular} }: { ${tableNameSingular}: ${tableNameSingularCapitalised} }) => {
  return (
    <li className="flex justify-between my-2">
      <div className="w-full">
        <div>{${tableNameSingular}.${schema.fields[0].name}}</div>
      </div>
      <${tableNameSingularCapitalised}Modal ${tableNameSingular}={${tableNameSingular}} />
    </li>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No ${toNormalEnglish(
        tableNameCamelCase,
        true
      )}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new ${tableNameSingular}.
      </p>
      <div className="mt-6">
        <${tableNameSingularCapitalised}Modal emptyState={true} />
      </div>
    </div>
  );
};

`;
};

const createFormComponent = (schema: Schema) => {
  const {
    tableNameCamelCase,
    tableNameSingular,
    tableNameSingularCapitalised,
    tableNameCapitalised,
    tableNameFirstChar,
  } = formatTableName(schema.tableName);

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
  }
import { useRouter } from "next/navigation";

const ${tableNameSingularCapitalised}Form = ({
  ${tableNameSingular},
  closeModal,
}: {
  ${tableNameSingular}?: ${tableNameSingularCapitalised};
  closeModal: () => void;
}) => {

  const editing = !!${tableNameSingular}?.id;

  const router = useRouter();
  const utils = trpc.useContext();

  const form = useForm<z.infer<typeof insert${tableNameSingularCapitalised}Params>>({
    // latest Zod release has introduced a TS error with zodResolver
    // open issue: https://github.com/colinhacks/zod/issues/2663
    // errors locally but not in production
    resolver: zodResolver(insert${tableNameSingularCapitalised}Params),
    defaultValues: ${tableNameSingular} ?? {
      ${schema.fields.map(
        (field) =>
          `${toCamelCase(field.name)}: ${defaultValueMappings[field.type]}`
      )}
    },
  });

  const onSuccess = () => {
    utils.${tableNameCamelCase}.get${tableNameCapitalised}.invalidate();
    router.refresh();
    closeModal();
  };

  const { mutate: create${tableNameSingularCapitalised}, isLoading: isCreating } =
    trpc.${tableNameCamelCase}.create${tableNameSingularCapitalised}.useMutation({
      onSuccess,
    });

  const { mutate: update${tableNameSingularCapitalised}, isLoading: isUpdating } =
    trpc.${tableNameCamelCase}.update${tableNameSingularCapitalised}.useMutation({
      onSuccess,
    });

  const { mutate: delete${tableNameSingularCapitalised}, isLoading: isDeleting } =
    trpc.${tableNameCamelCase}.delete${tableNameSingularCapitalised}.useMutation({
      onSuccess,
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
              <FormControl>
                ${
                  field.type === "boolean"
                    ? `<Checkbox {...field} checked={field.value} onCheckedChange={field.onChange} value={""} />`
                    : '<Input placeholder="" {...field} />'
                }
              </FormControl>
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
    tableNameCapitalised,
    tableNameFirstChar,
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
import { PlusIcon } from "lucide-react";

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
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New ${tableNameSingularCapitalised}
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
          <DialogTitle>{ editing ? "Edit" : "Create" } ${tableNameSingularCapitalised}</DialogTitle>
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
