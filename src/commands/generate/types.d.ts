import { DBField, DBType, ORMType } from "../../types.js";
import { ReferenceType } from "./utils.ts";

export type Schema = {
  tableName: string;
  fields: DBField[];
  index: string;
  belongsToUser?: boolean;
  includeTimestamps: boolean;
  children?: Schema[];
};

export type TypeMapFunctionParams = {
  name: string;
  references?: string;
  cascade?: boolean;
  referenceIdType?: ReferenceType;
  notNull?: boolean;
};

export type TypeMapFunction = (params: TypeMapFunctionParams) => string;

export type TypeMap = {
  tableFunc?: string;
  typeMappings: Record<string, TypeMapFunction>;
};

export type DbDriverTypeMapping = Record<DBType, TypeMap>;
export type ORMTypeMap = Record<ORMType, DbDriverTypeMapping>;
