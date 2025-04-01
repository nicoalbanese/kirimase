import { confirm } from "@clack/prompts";
import chalk from "chalk";
import { consola } from "consola";
import fs from "fs";
import { type CompiledTemplate } from "karozu";
import path from "path";

const renderPendingAction = (action: CompiledTemplate<any>) => {
  // Create a nicely formatted preview of the pending action using chalk and consola

  // Construct the content sections
  let sections = [
    `${chalk.bold("Title")}: ${chalk.cyan(action.title || "Untitled")}`,
    `${chalk.bold("Description")}: ${action.description || "No description provided"}`,
    `${chalk.bold("Path")}: ${chalk.yellow(action.path)}`,
  ];

  // Add operation-specific details with colorful formatting
  if (!action.operation || action.operation === "create") {
    sections.push(`${chalk.bold("Operation")}: ${chalk.green("Create file")}`);
    sections.push(`${chalk.bold("Content")}:\n${chalk.dim(action.template)}`);
  } else if (action.operation === "edit") {
    sections.push(`${chalk.bold("Operation")}: ${chalk.yellow("Edit file")}`);
    sections.push(
      `${chalk.bold("Replacements")}:\n${chalk.dim(JSON.stringify(action.replacements, null, 2))}`,
    );
  } else if (action.operation === "append") {
    sections.push(
      `${chalk.bold("Operation")}: ${chalk.yellow("Append to file")}`,
    );
    sections.push(`${chalk.bold("Content")}:\n${chalk.dim(action.content)}`);
  } else if (action.operation === "delete") {
    sections.push(`${chalk.bold("Operation")}: ${chalk.red("Delete file")}`);
  }

  // Use consola to create a beautiful box with the information
  // Choose the color based on the operation type
  let titleBackground;
  if (!action.operation || action.operation === "create") {
    titleBackground = chalk.bgGreen.white;
  } else if (action.operation === "append" || action.operation === "edit") {
    titleBackground = chalk.bgYellow.white;
  } else if (action.operation === "delete") {
    titleBackground = chalk.bgRed.white;
  } else {
    titleBackground = chalk.bgCyan.white; // Default fallback
  }

  consola.box({
    title: titleBackground(` ${action.operation?.toUpperCase() || "CREATE"} `),
    message: sections.join("\n\n"),
    style: {
      borderColor: "black",
      padding: 1,
    },
  });
};

/**
 * Prompts the user with a confirmation dialog using clack.
 * @param message The message to display to the user
 * @param preview Optional preview content to show before confirmation
 * @returns A promise that resolves to true if confirmed, false otherwise
 */
export const confirmOperation = async (
  action: CompiledTemplate<any>,
): Promise<boolean> => {
  try {
    // Show preview based on operation type
    renderPendingAction(action);

    // Ask for confirmation
    const confirmed = await confirm({
      message: `Proceed with ${action.operation || "create"} operation?`,
    });

    return confirmed === true;
  } catch (error) {
    console.error("Error during confirmation:", error);
    return false;
  }
};

/**
 * Adds a new file at the specified path with given content.
 */
export const addFile = (filePath: string, content: string): void => {
  try {
    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`File created successfully: ${filePath}`);
  } catch (error) {
    console.error(`Error creating file at ${filePath}:`, error);
    throw error;
  }
};

/**
 * Edits a file by finding and replacing text based on an array of replacements.
 */
export const editFile = (
  filePath: string,
  replacements: Array<{ search: string; replace: string }>,
): void => {
  try {
    // Read existing file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File doesn't exist: ${filePath}`);
    }

    let content = fs.readFileSync(filePath, "utf-8");

    // Apply all replacements
    replacements.forEach(({ search, replace }) => {
      content = content.replace(new RegExp(search, "g"), replace);
    });

    // Write updated content back to file
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`File edited successfully: ${filePath}`);
  } catch (error) {
    console.error(`Error editing file at ${filePath}:`, error);
    throw error;
  }
};

/**
 * Deletes a file at the specified path.
 */
export const deleteFile = (filePath: string): void => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File doesn't exist: ${filePath}`);
    }

    fs.unlinkSync(filePath);
    console.log(`File deleted successfully: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file at ${filePath}:`, error);
    throw error;
  }
};
