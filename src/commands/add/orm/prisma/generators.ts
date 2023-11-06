import { DBType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { prismaDbTypeMappings } from "./utils.js";

export const generatePrismaSchema = (
  dbType: DBType,
  usingPlanetscale: boolean
) => {
  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

generator zod {
  provider              = "zod-prisma"
  output                = "./zod" 
  relationModel         = true 
  modelCase             = "camelCase" 
  modelSuffix           = "Schema" 
  useDecimalJs          = true 
  prismaJsonNullability = true 
}

datasource db {
  provider = "${prismaDbTypeMappings[dbType]}"${
    usingPlanetscale ? `\n  relationMode = "prisma"` : ""
  }
  url      = ${dbType === "sqlite" ? '"file:./dev.db"' : 'env("DATABASE_URL")'}
}

`;
};

export const generatePrismaDbInstance = () => {
  return `import { PrismaClient } from "@prisma/client";

declare global {
  // allow global \`var\` declarations
  // eslint-disable-next-line no-var
  var db: PrismaClient | undefined;
}

export const db =
  global.db ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.db = db;
`;
};

export const generatePrismaComputerModel = () => {
  const { alias } = readConfigFile();
  return `import { computerSchema } from "${alias}/zodAutoGenSchemas";
import { z } from "zod";

export const insertComputerSchema = computerSchema;
export const insertComputerParams = computerSchema.omit({
  id: true,
});

export const updateComputerSchema = computerSchema.extend({
  id: z.string().cuid(),
});
export const updateComputerParams = updateComputerSchema.extend({
  brand: z.string().min(2),
  cores: z.coerce.number().min(2),
});
export const computerIdSchema = updateComputerSchema.pick({ id: true });

// Types for computers - used to type API request params and within Components
export type Computer = z.infer<typeof updateComputerSchema>;
export type NewComputer = z.infer<typeof computerSchema>;
export type NewComputerParams = z.infer<typeof insertComputerParams>;
export type UpdateComputerParams = z.infer<typeof updateComputerParams>;
export type ComputerId = z.infer<typeof computerIdSchema>["id"];
`;
};

export const generatePrismaComputerQueries = () => {
  const { alias } = readConfigFile();
  const dbIndex = getDbIndexPath("prisma");
  return `import { ComputerId, computerIdSchema } from "${alias}/lib/db/schema/computers";
import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";

export const getComputers = async () => {
  const c = await db.computer.findMany();
  return { computers: c };
};

export const getComputerById = async (id: ComputerId) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  const c = await db.computer.findFirst({ where: { id: computerId } });
  return { computer: c };
};`;
};

export const generatePrismaComputerMutations = () => {
  const { alias } = readConfigFile();
  const dbIndex = getDbIndexPath("prisma");
  return `import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import {
  ComputerId,
  NewComputerParams,
  UpdateComputerParams,
  updateComputerSchema,
  insertComputerSchema,
  computerIdSchema,
} from "${alias}/lib/db/schema/computers";

export const createComputer = async (computer: NewComputerParams) => {
  const newComputer = insertComputerSchema.parse({
    ...computer,
  });
  try {
    const c = await db.computer.create({ data: newComputer });
    return { computer: c };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};

export const updateComputer = async (
  id: ComputerId,
  computer: UpdateComputerParams
) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  const newComputer = updateComputerSchema.parse({
    ...computer,
  });
  try {
    const c = await db.computer.update({
      where: { id: computerId },
      data: newComputer,
    });
    return { computer: c };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};

export const deleteComputer = async (id: ComputerId) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  try {
    const c = await db.computer.delete({ where: { id: computerId } });
    return { computer: c };
  } catch (err) {
    return { error: (err as Error).message ?? "Error, please try again" };
  }
};
`;
};
