import fs from "fs";
import { createFile, replaceFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const updateClerkMiddlewareForStripe = (rootPath: string) => {
  const { clerk } = getFilePaths();
  const initMWContent = `export default authMiddleware({});`;
  const updatedMWContent = `export default authMiddleware({ ignoredRoutes: "/api/webhooks/stripe" });`;
  const mwPath = formatFilePath(clerk.middleware, {
    prefix: "rootPath",
    removeExtension: false,
  });
  const mwExists = fs.existsSync(mwPath);
  if (mwExists) {
    const mwContent = fs.readFileSync(mwPath, "utf-8");
    const newUtilsContent = mwContent.replace(initMWContent, updatedMWContent);
    replaceFile(mwPath, newUtilsContent);
  } else {
    console.error("Middleware does not exist");
  }
};
