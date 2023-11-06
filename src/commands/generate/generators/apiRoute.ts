import { DBType } from "../../../types.js";
import { createFile, readConfigFile } from "../../../utils.js";
import { formatFilePath, getFilePaths } from "../../filePaths/index.js";
import { Schema } from "../types.js";
import { formatTableName, toCamelCase } from "../utils.js";

export const scaffoldAPIRoute = (schema: Schema) => {
  const { hasSrc, driver } = readConfigFile();
  const { tableName } = schema;
  const path = `${hasSrc ? "src/" : ""}app/api/${toCamelCase(
    tableName
  )}/route.ts`;
  createFile(path, generateRouteContent(schema, driver));
};

const generateRouteContent = (schema: Schema, driver: DBType) => {
  const { tableName } = schema;
  const {
    tableNameSingularCapitalised,
    tableNameSingular,
    tableNameCamelCase,
  } = formatTableName(tableName);
  const { shared } = getFilePaths();

  const template = `import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  create${tableNameSingularCapitalised},
  delete${tableNameSingularCapitalised},
  update${tableNameSingularCapitalised},
} from "${formatFilePath(shared.orm.servicesDir, {
    prefix: "alias",
    removeExtension: false,
  })}/${tableNameCamelCase}/mutations";
import { 
  ${tableNameSingular}IdSchema,
  insert${tableNameSingularCapitalised}Params,
  update${tableNameSingularCapitalised}Params 
} from "${formatFilePath(shared.orm.schemaDir, {
    prefix: "alias",
    removeExtension: false,
  })}/${tableNameCamelCase}";

export async function POST(req: Request) {
  try {
    const validatedData = insert${tableNameSingularCapitalised}Params.parse(await req.json());
    const { ${
      driver === "mysql" ? "success" : tableNameSingular
    }, error } = await create${tableNameSingularCapitalised}(validatedData);
    if (error) return NextResponse.json({ error }, { status: 500 });
    revalidatePath("/${tableNameCamelCase}"); // optional - assumes you will have named route same as entity
    return NextResponse.json(${
      driver === "mysql" ? "success" : tableNameSingular
    }, { status: 201 });
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

    const validatedData = update${tableNameSingularCapitalised}Params.parse(await req.json());
    const validatedParams = ${tableNameSingular}IdSchema.parse({ id });

    const { ${
      driver === "mysql" ? "success" : tableNameSingular
    }, error } = await update${tableNameSingularCapitalised}(validatedParams.id, validatedData);

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(${
      driver === "mysql" ? "success" : tableNameSingular
    }, { status: 200 });
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
    const { ${
      driver === "mysql" ? "success" : tableNameSingular
    }, error } = await delete${tableNameSingularCapitalised}(validatedParams.id);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json(${
      driver === "mysql" ? "success" : tableNameSingular
    }, { status: 200 });
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
