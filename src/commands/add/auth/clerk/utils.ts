import fs from "fs";
import { replaceFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

// export const updateClerkMiddlewareForStripe = (rootPath: string) => {
//   const { clerk } = getFilePaths();
//   const initMWContent = `export default authMiddleware({});`;
//   const updatedMWContent = `export default authMiddleware({ ignoredRoutes: ["/api/webhooks/stripe"] });`;
//   const mwPath = formatFilePath(clerk.middleware, {
//     prefix: "rootPath",
//     removeExtension: false,
//   });
//   const mwExists = fs.existsSync(mwPath);
//   if (mwExists) {
//     const mwContent = fs.readFileSync(mwPath, "utf-8");
//     const newUtilsContent = mwContent.replace(initMWContent, updatedMWContent);
//     await replaceFile(mwPath, newUtilsContent);
//   } else {
//     console.error("Middleware does not exist");
//   }
// };

// TODO: Shouldn't this be "matcher" instead of "ignoredRoutes"?
export const addToClerkIgnoredRoutes = async (newPath: string) => {
  const { clerk } = getFilePaths();
  const initMWContent = "ignoredRoutes: [";
  const updatedMWContent = "ignoredRoutes: [" + ` "${newPath}", `;
  const mwPath = formatFilePath(clerk.middleware, {
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
