import fs from 'fs';
import path from 'path';

interface PackageJson {
  name: string;
  version: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export const addPackage = (packageName: string, version: string, isDev = false) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

  if (isDev) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      [packageName]: version,
    };
  } else {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      [packageName]: version,
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

export const addScripts = (scripts: Record<string, string>) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts,
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

export const addPackages = (packages: Array<{ name: string; version: string; isDev?: boolean }>) => {
  packages.forEach(({ name, version, isDev }) => {
    addPackage(name, version, isDev);
  });
}; 