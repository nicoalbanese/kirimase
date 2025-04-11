import { spinner } from "@clack/prompts";

export async function add(packageName: string) {
  const s = spinner();
  s.start(`Adding ${packageName} to your project`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  s.stop(`Added ${packageName} successfully!`);
}
