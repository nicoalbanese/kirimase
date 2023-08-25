import { createFile, readConfigFile } from "../../../utils.js";
import { Schema } from "../types.js";
import { formatTableName, toCamelCase } from "../utils.js";

export const scaffoldAPIRoute = (schema: Schema) => {
  const { hasSrc } = readConfigFile();
  const { tableName } = schema;
  const path = `${hasSrc ? "src/" : ""}app/api/${toCamelCase(
    tableName
  )}/route.ts`;
  createFile(path, generateRouteContent(schema));
};

const generateRouteContent = (schema: Schema) => {
  const { tableName } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameCamelCase,
  } = formatTableName(tableName);

  const template = `import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  create${tableNameSingularCapitalised},
  delete${tableNameSingularCapitalised},
  update${tableNameSingularCapitalised},
} from "@/lib/api/${tableNameCamelCase}/mutations";
import { ${tableNameSingular}IdSchema, insert${tableNameSingularCapitalised}Schema } from "@/lib/db/schema/${tableNameCamelCase}";

export async function POST(req: Request) {
  try {
    const validatedData = insert${tableNameSingularCapitalised}Schema.parse(await req.json());
    const { ${tableNameSingular}, error } = await create${tableNameSingularCapitalised}(validatedData);
    if (error) return NextResponse.json({ error }, { status: 500 });
    revalidatePath("/${tableNameCamelCase}"); // optional - assumes you will have named route same as entity
    return NextResponse.json(${tableNameSingular}, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    } else {
      return NextResponse.json({ error: err }, { status: 500 });
    }
  }
}


export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const validatedData = insert${tableNameSingularCapitalised}Schema.parse(await req.json());
    const validatedParams = ${tableNameSingular}IdSchema.parse({ id });

    const { ${tableNameSingular} } = await update${tableNameSingularCapitalised}(validatedParams.id, validatedData);

    return NextResponse.json(${tableNameSingular}, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    } else {
      return NextResponse.json(err, { status: 500 });
    }
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const validatedParams = ${tableNameSingular}IdSchema.parse({ id });
    const { ${tableNameSingular} } = await delete${tableNameSingularCapitalised}(validatedParams.id);
    return NextResponse.json(${tableNameSingular}, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    } else {
      return NextResponse.json(err, { status: 500 });
    }
  }
}
`;
  return template;
};
