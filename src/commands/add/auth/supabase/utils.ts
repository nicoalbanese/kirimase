import { replaceFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import fs from "fs";

// TODO: Idk if this is necessary for Supabase
export const addToSupabasegnoredRoutes = async (newPath: string) => {
  const { supabase } = getFilePaths();
  const initMWContent = "ignoredRoutes: [";
  const updatedMWContent = "ignoredRoutes: [" + ` "${newPath}", `;
  const mwPath = formatFilePath(supabase.middleware, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const mwExists = fs.existsSync(mwPath);
  if (mwExists) {
    const mwContent = fs.readFileSync(mwPath, "utf-8");
    const newUtilsContent = mwContent.replace(initMWContent, updatedMWContent);
    await replaceFile(mwPath, newUtilsContent);
  } else {
    console.error("Middleware does not exist");
  }
};
