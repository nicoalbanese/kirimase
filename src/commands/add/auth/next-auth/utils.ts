import { ORMType } from "../../../../types.js";

export type AuthProvider = "discord" | "google" | "github" | "apple";
type ProviderConfig = {
  [key in AuthProvider]: { code: string; website: string };
};

export const AuthProviders: ProviderConfig = {
  discord: {
    code: `DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })`,
    website: "https://discord.com/developers/applications",
  },
  google: {
    code: `GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })`,
    website: "https://console.cloud.google.com/apis/credentials",
  },
  github: {
    code: `GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })`,
    website: "https://github.com/settings/apps",
  },
  apple: {
    code: `AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    })`,
    website: "https://developer.apple.com/account/resources/identifiers/list",
  },
};

export const capitalised = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const AuthDriver: {
  [key in ORMType]: { import: string; adapter: string; package: string };
} = {
  prisma: {
    import: 'import { PrismaAdapter } from "@auth/prisma-adapter"',
    adapter: "PrismaAdapter",
    package: "@auth/prisma-adapter",
  },
  drizzle: {
    import: 'import { DrizzleAdapter } from "@auth/drizzle-adapter";',
    adapter: "DrizzleAdapter",
    package: "@auth/drizzle-adapter",
  },
};
