import { DBType } from "../../../../types.js";

export const prismaDbTypeMappings: { [key in DBType]: string } = {
  pg: "postgresql",
  mysql: "mysql",
  sqlite: "sqlite",
};
