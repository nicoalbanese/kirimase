export function scaffoldResource(tableName: string, fields: string[]) {
  const properties = parseFields(fields);
  createModel(tableName, properties);
  createAPIRoutes(tableName, properties);
  // Other scaffolding logic here (e.g., views, tests, etc.)
}

function parseFields(fields: string[]) {
  return fields.map((field) => {
    const [name, type] = field.split(":");
    return { name, type };
  });
}

function createModel(
  tableName: string,
  properties: { name: string; type: string }[]
) {
  // Logic to create the model file
  console.log(tableName, properties);
}

function createAPIRoutes(
  tableName: string,
  properties: { name: string; type: string }[]
) {
  // Logic to create the controller file
  console.log(tableName, properties);
}
