// Navbar.tsx
// Sidebar.tsx
// SidebarItems.tsx
// config/nav.ts

import { createFile, readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const addNavbar = () => {
  // create navbar
  createFile(
    formatFilePath("components/Navbar.tsx", {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateNavbarTsx()
  );
};

const generateSidebarTsx = () => {
  const { auth, componentLib } = readConfigFile();
  const { shared } = getFilePaths();
  if (auth === null) {
    return `import SidebarItems from "./SidebarItems";

const Sidebar = () => {
  return (
    <aside className="h-screen min-w-52 bg-muted hidden md:block p-4 pt-8 border-r border-border shadow-inner">
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold ml-4">Logo</h3>
          <SidebarItems />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
`;
  } else
    return `import Link from "next/link";

import SidebarItems from "./SidebarItems";${
      componentLib === "shadcn-ui"
        ? `\nimport { Avatar, AvatarImage } from "./ui/avatar";`
        : null
    }

import { AuthSession, getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      {
        prefix: "alias",
        removeExtension: false,
      }
    )}";

const Sidebar = async () => {
  const session = await getUserAuth();
  if (session.session === null) return null;

  return (
    <aside className="h-screen min-w-52 bg-muted hidden md:block p-4 pt-8 border-r border-border shadow-inner">
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold ml-4">Logo</h3>
          <SidebarItems />
        </div>
        <UserDetails session={session} />
      </div>
    </aside>
  );
};

export default Sidebar;

const UserDetails = ({ session }: { session: AuthSession }) => {
  if (session.session === null) return null;
  const { user } = session.session;

  return (
    <Link href="/account">
      <div className="flex items-center justify-between w-full border-t border-border pt-4 px-2">
        <div className="text-muted-foreground">
          <p className="text-xs">{user.name ?? "John Doe"}</p>
          <p className="text-xs font-light pr-4">
            {user.email ?? "john@doe.com"}
          </p>
        </div>
        ${
          componentLib === "shadcn-ui"
            ? `<Avatar className="h-10 w-10">
          <AvatarImage src={user.image} />
        </Avatar>`
            : `<img
          src={user.image}
          className="h-10 w-10 rounded-full"
          alt={user.id + "_photo"}
        />`
        }
      </div>
    </Link>
  );
};
`;
};

const generateNavbarTsx = () => {
  return `"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AlignRight } from "lucide-react";

import { Button } from "${formatFilePath("components/ui/button", {
    prefix: "alias",
    removeExtension: false,
  })}";
import { defaultLinks } from "${formatFilePath("config/nav", {
    prefix: "alias",
    removeExtension: false,
  })}";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="md:hidden border-b mb-4 pb-2 w-full">
      <nav className="flex justify-between w-full items-center">
        <div className="font-semibold text-lg">Logo</div>
        <Button variant="ghost" onClick={() => setOpen(!open)}>
          <AlignRight />
        </Button>
      </nav>
      {open ? (
        <div className="my-4 p-4 bg-muted">
          <ul className="space-y-2">
            {defaultLinks.map((link) => (
              <li key={link.title} onClick={() => setOpen(false)} className="">
                <Link
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "text-primary hover:text-primary font-semibold"
                      : "text-muted-foreground hover:text-primary"
                  }
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
`;
};
