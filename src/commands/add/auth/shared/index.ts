import { createFile, readConfigFile } from "../../../../utils.js";
import { addToShadcnComponentList } from "../../utils.js";
import {
  createAccountApiTs,
  createAccountCardComponent,
  createAccountPage,
  createUserSettingsComponent,
  createUpdateNameCard,
  createUpdateEmailCard,
  // createNavbar,
  createSignOutBtn,
} from "./generators.js";
import { AuthType, ORMType } from "../../../../types.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import {
  enableSessionInContext,
  updateTrpcTs,
} from "../next-auth/generators.js";

export const createAccountSettingsPage = async () => {
  const { orm, rootPath, componentLib, auth } = readConfigFile();
  const { shared } = getFilePaths();
  const withShadCn = componentLib === "shadcn-ui" ? true : false;

  // create account api - clerk has managed components so no need - supabase has its own client to update user details
  if (auth !== "supabase" && auth !== "clerk" && auth !== "lucia") {
    await createFile(
      formatFilePath(shared.auth.accountApiRoute, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createAccountApiTs(orm)
    );
  }

  // create account page
  await createFile(
    formatFilePath(shared.auth.accountPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountPage()
  );

  // create usersettings component
  await createFile(
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
  await createFile(
    formatFilePath(shared.auth.updateNameCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateNameCard(withShadCn, auth !== "lucia", auth === "lucia")
  );

  // create updatenamecard
  await createFile(
    formatFilePath(shared.auth.updateEmailCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createUpdateEmailCard(withShadCn, auth !== "lucia", auth === "lucia")
  );

  // create accountcard components
  await createFile(
    formatFilePath(shared.auth.accountCardComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountCardComponent(withShadCn)
  );

  // create navbar component
  // await createFile(
  //   formatFilePath(shared.init.navbarComponent, {
  //     prefix: "rootPath",
  //     removeExtension: false,
  //   }),
  //   createNavbar(withShadCn, auth === "clerk", auth)
  // );

  // TODO FIX THIS
  if (withShadCn && auth !== "lucia" && auth !== "supabase") {
    await createFile(
      formatFilePath(lucia.signOutButtonComponent, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      createSignOutBtn()
    );
  }
  // add navbar to root layout
  // addContextProviderToLayout("Navbar");
  if (withShadCn) {
    // consola.start("Installing Card component for account page...");
    // await installShadcnUIComponents(["card"]);
    addToShadcnComponentList(["card"]);
  }
};

export const updateTrpcWithSessionIfInstalled = async () => {
  const { packages, t3 } = readConfigFile();
  if (packages.includes("trpc")) {
    if (!t3) {
      await updateTrpcTs();
      await enableSessionInContext();
    }
  }
};
