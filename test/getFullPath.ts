import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { routerPaths } from '../src/core/settings/paths';

export const getFullPath = (path: string) => {
  return GLOBAL_PREFIX ? `/${GLOBAL_PREFIX}${path}` : path;
};

export const fullPathTo = {
  auth: getFullPath(routerPaths.auth),
  users: getFullPath(routerPaths.users),
  blogs: getFullPath(routerPaths.blogs),
  posts: getFullPath(routerPaths.posts),
  comments: getFullPath(routerPaths.comments),
  security: getFullPath(routerPaths.security),
  //add also others entity route
};
