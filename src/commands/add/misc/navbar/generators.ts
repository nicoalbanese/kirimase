// Navbar.tsx
// Sidebar.tsx
// SidebarItems.tsx
// config/nav.ts

import { createFile, readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const addNavbarAndSettings = () => {
  const { componentLib } = readConfigFile();

  // create navbar
  createFile(
    formatFilePath("components/Navbar.tsx", {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateNavbarTsx()
  );

  // create sidebar
  createFile(
    formatFilePath("components/Sidebar.tsx", {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateSidebarTsx()
  );

  // create sidebaritems
  createFile(
    formatFilePath("components/SidebarItems.tsx", {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateSidebarItemsTsx()
  );

  // create sidebaritems
  createFile(
    formatFilePath("config/nav.ts", {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateNavConfig()
  );

  // create settings page

  if (componentLib === "shadcn-ui")
    createFile(
      formatFilePath("app/(app)/settings/page.tsx", {
        removeExtension: false,
        prefix: "rootPath",
      }),
      generateSettingsPage()
    );
};

const generateSettingsPage = () => {
  return `"use client";

import { Button } from "${formatFilePath("components/ui/button", {
    prefix: "alias",
    removeExtension: false,
  })}";
import { useTheme } from "next-themes";

export default function Page() {
  const { setTheme } = useTheme();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="space-y-4 my-4">
        <div>
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of the app. Automatically switch between
            day and night themes.
          </p>
        </div>
        <Button
          asChild
          variant={"ghost"}
          className="w-fit h-fit"
          onClick={() => setTheme("light")}
        >
          <div className="flex flex-col">
            <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
              <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Light
            </span>
          </div>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          onClick={() => setTheme("dark")}
          className="w-fit h-fit"
        >
          <div className="flex flex-col">
            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-2 rounded-sm bg-neutral-950 p-2">
                <div className="space-y-2 rounded-md bg-neutral-800 p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-neutral-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-neutral-800 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Dark
            </span>
          </div>
        </Button>
        <Button
          asChild
          variant={"ghost"}
          onClick={() => setTheme("system")}
          className="w-fit h-fit"
        >
          <div className="flex flex-col">
            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-2 rounded-sm bg-neutral-300 p-2">
                <div className="space-y-2 rounded-md bg-neutral-600 p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-neutral-600 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-neutral-600 p-2 shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-neutral-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-neutral-400" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              System
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
`;
};

const generateNavConfig = () => {
  const { componentLib, auth } = readConfigFile();
  return `import { SidebarLink } from "${formatFilePath(
    "components/SidebarItems",
    {
      prefix: "alias",
      removeExtension: false,
    }
  )}";
import { Cog, Globe, HomeIcon } from "lucide-react";

type AdditionalLinks = {
  title: string;
  links: SidebarLink[];
};

export const defaultLinks: SidebarLink[] = [
  { href: "/dashboard", title: "Home", icon: HomeIcon },${
    auth !== null
      ? `\n  { href: "/account", title: "Account", icon: Cog },`
      : ""
  }${
    componentLib === "shadcn-ui"
      ? `\n  { href: "/settings", title: "Settings", icon: Cog },`
      : ""
  }
];

export const additionalLinks: AdditionalLinks[] = [];
`;
};

const generateSidebarItemsTsx = () => {
  const { componentLib } = readConfigFile();
  const { shared } = getFilePaths();
  return `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LucideIcon } from "lucide-react";

${
  componentLib === "shadcn-ui"
    ? `import { cn } from "${formatFilePath(shared.init.libUtils, {
        prefix: "alias",
        removeExtension: true,
      })}";`
    : ""
}
import { defaultLinks, additionalLinks } from "${formatFilePath("config/nav", {
    removeExtension: false,
    prefix: "alias",
  })}";

export interface SidebarLink {
  title: string;
  href: string;
  icon: LucideIcon;
}

const SidebarItems = () => {
  return (
    <>
      <SidebarLinkGroup links={defaultLinks} />
      {additionalLinks.length > 0
        ? additionalLinks.map((l) => (
            <SidebarLinkGroup
              links={l.links}
              title={l.title}
              border
              key={l.title}
            />
          ))
        : null}
    </>
  );
};
export default SidebarItems;

const SidebarLinkGroup = ({
  links,
  title,
  border,
}: {
  links: SidebarLink[];
  title?: string;
  border?: boolean;
}) => {
  const fullPathname = usePathname();
  const pathname = "/" + fullPathname.split("/")[1];

  return (
    <div className={border ? "border-border border-t my-8 pt-4" : ""}>
      {title ? (
        <h4 className="px-2 mb-2 text-xs uppercase text-muted-foreground tracking-wider">
          {title}
        </h4>
      ) : null}
      <ul>
        {links.map((link) => (
          <li key={link.title}>
            <SidebarLink link={link} active={pathname === link.href} />
          </li>
        ))}
      </ul>
    </div>
  );
};
const SidebarLink = ({
  link,
  active,
}: {
  link: SidebarLink;
  active: boolean;
}) => {
  return (
    <Link
      href={link.href}
      className={\`group transition-colors p-2 inline-block hover:bg-popover hover:text-primary text-muted-foreground text-xs hover:shadow rounded-md w-full\${
        active ? " text-primary font-semibold" : ""
      }\`}
    >
      <div className="flex items-center">
        <div
          ${
            componentLib === "shadcn-ui"
              ? `className={cn(
            "opacity-0 left-0 h-6 w-[4px] absolute rounded-r-lg bg-primary",
            active ? "opacity-100" : "",
          )}`
              : `className={\`opacity-0 left-0 h-6 w-[4px] absolute rounded-r-lg bg-primary\${
            active ? " opacity-100" : ""
          }\`}`
          }
        />
        <link.icon className="h-3.5 mr-1" />
        <span>{link.title}</span>
      </div>
    </Link>
  );
};
`;
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
      auth === "clerk"
        ? `import { UserButton } from "@clerk/nextjs";`
        : componentLib === "shadcn-ui"
          ? `\nimport { Avatar, AvatarFallback } from "./ui/avatar";`
          : null
    }

import { AuthSession, getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      {
        prefix: "alias",
        removeExtension: true,
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

  if (!user?.name || user.name.length == 0) return null;

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
          auth === "clerk"
            ? `<UserButton afterSignOutUrl="/" />`
            : componentLib === "shadcn-ui"
              ? `<Avatar className="h-10 w-10">
          <AvatarFallback className="border-border border-2 text-muted-foreground">
            {user.name
              ? user.name
                  ?.split(" ")
                  .map((word) => word[0].toUpperCase())
                  .join("")
              : "~"}
          </AvatarFallback>
        </Avatar>`
              : `<div className="p-1.5 rounded-full border-border border-2 text-muted-foreground">
          {user.name
            ? user.name
                ?.split(" ")
                .map((word) => word[0].toUpperCase())
                .join("")
            : "~"}
        </div>`
        }
      </div>
    </Link>
  );
};
`;
};

const generateNavbarTsx = () => {
  const { componentLib } = readConfigFile();
  return `"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";${
    componentLib === "shadcn-ui"
      ? `\n\nimport { Button } from "${formatFilePath("components/ui/button", {
          prefix: "alias",
          removeExtension: false,
        })}";`
      : ""
  }

import { AlignRight } from "lucide-react";
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
        ${
          componentLib === "shadcn-ui"
            ? `<Button variant="ghost" onClick={() => setOpen(!open)}>
          <AlignRight />
        </Button>`
            : `<button onClick={() => setOpen(!open)}>
          <AlignRight />
        </button>`
        }
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
