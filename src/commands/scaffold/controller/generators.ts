import { DBField } from "../../../types.js";
import { capitaliseForZodSchema, toCamelCase } from "../utils.js";

export const generateAPIRoute = (tableName: string, fields: DBField[]) => {
  const tableNameCamelCase = toCamelCase(tableName);
  const schemaName = capitaliseForZodSchema(tableNameCamelCase);

  let code = `
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ${tableNameCamelCase} } from "@/lib/db/schema/${tableNameCamelCase}"; 
import { insert${schemaName}Schema } from "@/lib/db/schema/${tableNameCamelCase}";
import { db } from "@/lib/db";
import { z } from "zod";

// URL parameter schema for PUT and DELETE
const urlParamSchema = z.object({
  id: z.number(),
});

export async function GET() {
  try {
    const result = await db.select().from(${tableNameCamelCase});
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({error: err}, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const validatedData = insert${schemaName}Schema.parse(await req.json());
    const new${schemaName} = await db.insert(${tableNameCamelCase}).values(validatedData).returning();
    return NextResponse.json(new${schemaName}, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    } else {
      return NextResponse.json( { error: err }, { status: 500 });
    }
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const validatedData = insert${schemaName}Schema.parse(await req.json());
    const validatedParams = urlParamSchema.parse({ id });
    const updated${schemaName} = await db.update(${tableNameCamelCase}).set(validatedData).where( eq(${tableNameCamelCase}.id, validatedParams.id ));
    return NextResponse.json(updated${schemaName});
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 } );
    } else {
      return NextResponse.json(err, { status: 500 });
    }
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const validatedParams = urlParamSchema.parse({ id });
    const deleted${schemaName} = await db.delete(${tableNameCamelCase}).where(eq( ${tableNameCamelCase}.id, validatedParams.id )).returning({id: ${tableNameCamelCase}.id}); // TODO: update for drizzle
    return NextResponse.json(deleted${schemaName}, {status: 200});
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    } else {
      return NextResponse.json(err, { status: 500 });
    }
  }
}`;

  return code;
};

const generateApiRouteCode = ({
  tableName,
  fields,
}: {
  tableName: string;
  fields: { name: string; type: string }[];
}) => {
  const tableNameCamelCase = toCamelCase(tableName);
  const schemaName =
    tableNameCamelCase.charAt(0).toLowerCase() + tableNameCamelCase.slice(1);
};
