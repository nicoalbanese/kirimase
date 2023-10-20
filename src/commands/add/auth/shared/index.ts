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

export const createAccountSettingsPage = async () => {
  const { orm, rootPath, componentLib, auth } = readConfigFile();
  const withShadCn = componentLib === "shadcn-ui" ? true : false;
  // create account api
  if (auth !== "clerk") {
    createFile(
      rootPath.concat("app/api/account/route.ts"),
      createAccountApiTs(orm)
    );
  }

  // create account page
  createFile(rootPath.concat("app/account/page.tsx"), createAccountPage());

  // create usersettings component
  createFile(
    rootPath.concat("app/account/UserSettings.tsx"),
    createUserSettingsComponent()
  );

  await scaffoldAccountSettingsUI(rootPath, withShadCn, auth);
};

export const scaffoldAccountSettingsUI = async (
  rootPath: string,
  withShadCn: boolean,
  auth: AuthType
) => {
  // create updatenamecard
  createFile(
    rootPath.concat("app/account/UpdateNameCard.tsx"),
    createUpdateNameCard(withShadCn, auth !== "lucia")
  );

  // create updatenamecard
  createFile(
    rootPath.concat("app/account/UpdateEmailCard.tsx"),
    createUpdateEmailCard(withShadCn, auth !== "lucia")
  );

  // create accountcard components
  createFile(
    rootPath.concat("app/account/AccountCard.tsx"),
    createAccountCardComponent(withShadCn)
  );

  // create navbar component
  createFile(
    rootPath.concat("components/Navbar.tsx"),
    createNavbar(withShadCn, auth === "clerk")
  );
  if (withShadCn) {
    createFile(
      rootPath.concat("components/auth/SignOutBtn.tsx"),
      createSignOutBtn()
    );
  }
  // add navbar to root layout
  addContextProviderToLayout("Navbar");
  if (withShadCn) {
    consola.start("Installing Card component for account page...");
    await installShadcnUIComponents(["card", "input", "label"]);
  }
};
