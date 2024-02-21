import { replaceFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import fs from "fs";

// TODO: Find out if this is actually necessary for Supabase
export const addToSupabaseIgnoredRoutes = async (newPath: string) => {
  const { supabase } = getFilePaths();

  const initMWContent = "matcher: [";

  const updatedMWContent = "matcher: [" + ` "${newPath}", `;

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
