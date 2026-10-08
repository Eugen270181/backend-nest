export const routerPaths = {
  common: '/',
  users: '/sa/users',
  blogs: '/blogs',
  saBlogs: '/sa/blogs',
  posts: '/posts',
  comments: '/comments',
  testing: '/testing',
  inTesting: '/all-data',
  security: '/security',
  inSecurity: '/devices',
  auth: '/auth',
  login: '/login',
  me: '/me',
  registration: '/registration',
  registrationConfirmation: '/registration-confirmation',
  registrationEmailResending: '/registration-email-resending',
  passwordRecovery: '/password-recovery',
  newPassword: '/new-password',
  refreshToken: '/refresh-token',
  logout: '/logout',
  docs: '/docs',
};

export const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//экранирование спецсимволов для ILIKE: % и _ (и сам \) в поисковой строке
//должны искаться как обычные символы, иначе searchNameTerm=% вернёт всё подряд
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');
