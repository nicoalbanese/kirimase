import { consola } from "consola";
import {
  createFile,
  installShadcnUIComponents,
  readConfigFile,
} from "../../../../utils.js";
import { addContextProviderToLayout } from "../../utils.js";
import {
  createAccountApiTs,
  createAccountCardComponent,
  createAccountPage,
  createUserSettingsComponent,
  createUpdateNameCard,
  createUpdateEmailCard,
  createNavbar,
  createSignOutBtn,
} from "./generators.js";
import { AuthType, ORMType } from "../../../../types.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const createAccountSettingsPage = async () => {
  const { orm, rootPath, componentLib, auth } = readConfigFile();
  const { shared } = getFilePaths();
  const withShadCn = componentLib === "shadcn-ui" ? true : false;
  // create account api - clerk has managed component so no need
  if (auth !== "clerk") {
    createFile(
      formatFilePath(shared.auth.accountApiRoute, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createAccountApiTs(orm)
    );
  }

  // create account page
  createFile(
    formatFilePath(shared.auth.accountPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountPage()
  );

  // create usersettings component
  createFile(
    formatFilePath(shared.auth.userSettingsComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUserSettingsComponent()
  );

  await scaffoldAccountSettingsUI(rootPath, withShadCn, auth);
};

export const scaffoldAccountSettingsUI = async (
  rootPath: string,
  withShadCn: boolean,
  auth: AuthType
) => {
  const { shared, lucia } = getFilePaths();
  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateNameCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateNameCard(withShadCn, auth !== "lucia")
  );

  // create updatenamecard
  createFile(
    formatFilePath(shared.auth.updateEmailCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateEmailCard(withShadCn, auth !== "lucia")
  );

  // create accountcard components
  createFile(
    formatFilePath(shared.auth.accountCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountCardComponent(withShadCn)
  );

  // create navbar component
  createFile(
    formatFilePath(shared.auth.navbarComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createNavbar(withShadCn, auth === "clerk", auth)
  );
  if (withShadCn) {
    createFile(
      formatFilePath(lucia.signOutButtonComponent, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createSignOutBtn()
    );
  }
  // add navbar to root layout
  addContextProviderToLayout("Navbar");
  if (withShadCn) {
    consola.start("Installing Card component for account page...");
    await installShadcnUIComponents(["card"]);
  }
};
