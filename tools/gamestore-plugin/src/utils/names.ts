import { names as nxNames } from '@nx/devkit';

export function toNames(value: string) {
  return nxNames(value);
}

export function featureImportPath(name: string) {
  return `@gamestore/web/feature-${toNames(name).fileName}`;
}

export function sharedImportPath(scope: string, name: string) {
  return `@gamestore/${scope}/${toNames(name).fileName}`;
}

export function apiImportPath(name: string) {
  return `@gamestore/api/${toNames(name).fileName}`;
}
