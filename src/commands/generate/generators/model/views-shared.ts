import { existsSync, readFileSync } from "fs";
import { formatFilePath } from "../../../filePaths/index.js";
import { formatTableName } from "../../utils.js";
import { replaceFile } from "../../../../utils.js";

export const addLinkToSidebar = (tableName: string) => {
  const { tableNameKebabCase, tableNameNormalEnglishCapitalised } =
    formatTableName(tableName);
  const sidebarConfigPath = formatFilePath("config/nav.ts", {
    prefix: "rootPath",
    removeExtension: false,
  });
  const configExists = existsSync(sidebarConfigPath);
  if (!configExists) return;

  const configContents = readFileSync(sidebarConfigPath, "utf-8");
  const initContents: string =
    "export const additionalLinks: AdditionalLinks[] = [];";
  const replacedInitContents = `export const additionalLinks: AdditionalLinks[] = [
  {
    title: "Entities",
    links: [
      {
        href: "/${tableNameKebabCase}",
        title: "${tableNameNormalEnglishCapitalised}",
        icon: Globe,
      },
    ],
  },

];
`;
  let newContent: string;
  if (configContents.indexOf(initContents) !== -1) {
    newContent = configContents.replace(initContents, replacedInitContents);
  } else {
    if (configContents.indexOf(tableNameKebabCase) !== -1) return;
    const searchQuery = `    title: "Entities",
    links: [
`;
    const replacement = `    title: "Entities",
    links: [
      {
        href: "/${tableNameKebabCase}",
        title: "${tableNameNormalEnglishCapitalised}",
        icon: Globe,
      },
`;
    newContent = configContents.replace(searchQuery, replacement);
  }
  replaceFile(sidebarConfigPath, newContent);
};
