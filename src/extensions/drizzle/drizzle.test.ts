import { describe, it, expect,  } from "vitest";
import { drizzle } from "./config";
import { templates } from "./templates";
import { formatCode } from "../../utils/format-code";

describe("drizzle template", () => {
  const result = drizzle.compile(templates, {
    dbType: "mysql",
    provider: "planetscale",
  });

  it("should compile and return defined result", () => {
    expect(result).toBeDefined();
    expect(result.templates.length).toBeGreaterThan(0);
  });

  it("should have correct core dependencies", () => {
    expect(result.dependencies).toStrictEqual([
      "drizzle-orm",
      "mysql2",
      "planetscale",
    ]);
  });

  it("should have correct dev dependencies", () => {
    expect(result.devDependencies).toStrictEqual(["drizzle-kit"]);
  });

  it("should include drizzle config file", async () => {
    const config = result.templates.find((t) => t.path === "drizzle.config.ts");
    expect(config).toBeDefined();
    expect(config?.operation).toBe("create");

    const template =
      config?.operation === "create" ? config.template : undefined;

    if (!template) {
      expect.fail("Template should be defined");
    }
    const formatted = await formatCode(template);

    const expectedTemplate = await formatCode(`import { defineConfig } from "drizzle-kit";

    export default defineConfig({
      dialect: "mysql",
      provider: "planetscale",
      schema: "./src/schema.ts",
      out: "./drizzle",
    });
      `)
    expect(formatted).toEqual(expectedTemplate);
  });
});
