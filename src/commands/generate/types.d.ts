import { DBField } from "../../types.js";

export type Schema = {
  tableName: string;
  fields: DBField[];
  index: string;
  belongsToUser?: boolean;
};
