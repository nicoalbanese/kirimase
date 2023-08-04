export function toCamelCase(input: string): string {
  return input
    .split("_")
    .map((word, index) => {
      if (index === 0) return word; // Return the first word as is
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the first letter of the rest
    })
    .join("");
}

export function generateModelContent(
  tableName: string,
  fields: { name: string; type: string }[],
  driver: string
) {
  const config = {
    pg: {
      tableFunc: "pgTable",
      typeMappings: {
        id: (name: string) => `serial('${name}').primaryKey()`,
        string: (name: string) => `varchar("${name}", { length: 256 })`,
        text: (name: string) => `text("${name}")`,
        number: (name: string) => `integer('${name}')`,
        references: (name: string, referencedTable: string) =>
          `integer('${name}').references(() => ${referencedTable}.id)`,
        // Add more types here as needed
      },
    },
    mysql2: {
      tableFunc: "mysqlTable",
      typeMappings: {
        varchar: (name: string) => `varchar("${name}", { length: 256 })`,
        number: (name: string) => `int('${name}')`,
      },
    },
    sqlite: {
      tableFunc: "sqliteTable",
      typeMappings: {
        string: (name: string) => `text('${name}')`,
        number: (name: string) => `integer('${name}')`,
      },
    },
  }[driver];

  const usedTypes: string[] = fields
    .map((field) => {
      const mappingFunction = config.typeMappings[field.type];
      // Assuming 'field.name' contains the appropriate value for the 'name' parameter
      return mappingFunction(field.name).split("(")[0];
    })
    .concat(config.typeMappings["id"]("id").split("(")[0]); // Assuming number (int) is always used for the 'id' field

  const uniqueTypes = Array.from(new Set(usedTypes));
  const importStatement = `import {${uniqueTypes.join(
    ", "
  )}} from 'drizzle-orm/${driver}';`;

  const schemaFields = fields
    .map(
      (field) =>
        `  ${toCamelCase(field.name)}: ${config.typeMappings[field.type](
          field.name,
          tableName
        )}`
    )
    .join(",\n");

  const schema = `export const ${toCamelCase(tableName)} = ${
    config.tableFunc
  }('${tableName}', {
  id: ${config.typeMappings["id"]("id")},
${schemaFields}
});`;

  return `${importStatement}\n\n${schema}`;
}
