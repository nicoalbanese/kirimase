export type AuthProvider = "discord" | "google" | "github" | "apple";
type ProviderConfig = { [key in AuthProvider]: string };

export const AuthProviders: ProviderConfig = {
  discord: `DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })`,
  google: `GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })`,
  github: `GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })`,
  apple: `AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    })`,
};

export const capitalised = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
