export function toCamelCase(input: string): string {
  return input
    .split("_")
    .map((word, index) => {
      if (index === 0) return word; // Return the first word as is
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the first letter of the rest
    })
    .join("");
}

export function snakeToKebab(snakeString: string): string {
  return snakeString.replace(/_/g, "-");
}

export function capitaliseForZodSchema(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1, -1);
}
