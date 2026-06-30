import { joinPathFragments } from '@nx/devkit';

export function sharedLibRoot(name: string) {
  return joinPathFragments('libs', 'shared', name);
}

export function webFeatureRoot(name: string) {
  return joinPathFragments('libs', 'web', `feature-${name}`);
}

export function apiLibRoot(name: string) {
  return joinPathFragments('libs', 'api', name);
}

export function webLibRoot(name: string) {
  return joinPathFragments('libs', 'web', name);
}
