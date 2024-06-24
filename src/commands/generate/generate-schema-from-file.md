## Generating schemas from JSON file

You can also import and generate schemas from a JSON file via the command

```sh
kirimase generate -f <path-to-schema.json>
```

### Input format

You must provide an array of schema, and each of them must follows the `Schema` type definition

```typescript
type Schema = {
  tableName: string;
  fields: {
    name: string;
    type: T;
    references?: string;
    notNull?: boolean;
    cascade?: boolean;
  };
  index: string;
  belongsToUser?: boolean;
  includeTimestamps: boolean;
  children?: Schema[];
};
```

As you can guess, providing more than one schema will make Kirimase generates multiple schemas in a single `generate` command

### Examples

Here's a sample of a valid `schema.json`

```json
[
  {
    "tableName": "products",
    "fields": [
      { "name": "name", "type": "varchar", "notNull": true },
      { "name": "price", "type": "number", "notNull": true }
    ],
    "index": "name",
    "belongsToUser": false,
    "includeTimestamps": true,
    "children": []
  }
]
```

Another example with children

```json
[
  {
    "tableName": "product_discounts",
    "fields": [
      { "name": "code", "type": "number", "notNull": true },
      { "name": "amount", "type": "number", "notNull": true }
    ],
    "index": null,
    "belongsToUser": false,
    "includeTimestamps": false,
    "children": [
      {
        "tableName": "product_discount_analytics",
        "fields": [{ "name": "used_count", "type": "number", "notNull": true }],
        "index": null,
        "belongsToUser": false,
        "includeTimestamps": false,
        "children": []
      }
    ]
  }
]
```
