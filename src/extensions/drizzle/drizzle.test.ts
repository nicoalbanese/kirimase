import { describe, it, expect } from "vitest";
import { drizzle } from "./config";
import { templates } from "./templates";

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

  it("should include drizzle config file", () => {
    const config = result.templates.find((t) => t.path === "drizzle.config.ts");
    expect(config).toBeDefined();
  });
});
