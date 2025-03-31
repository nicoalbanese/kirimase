import { cancel } from "@clack/prompts";

export type TypeSelectOptions<T> = { value: T; label: string }[];

export const exit = () => {
  cancel("Initialization cancelled.");
  process.exit(0);
}
