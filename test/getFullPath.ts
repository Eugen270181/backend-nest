import { GLOBAL_PREFIX } from '../src/setup/global-prefix.setup';
import { routerPaths } from '../src/core/settings/paths';

export const getFullPath = (path: string) => {
  return GLOBAL_PREFIX ? `/${GLOBAL_PREFIX}${path}` : path;
};

export const fullPathTo = {
  users: getFullPath(routerPaths.users),
  blogs: getFullPath(routerPaths.blogs),
  posts: getFullPath(routerPaths.posts),
  comments: getFullPath(routerPaths.comments),
  //add also others entity route
};
