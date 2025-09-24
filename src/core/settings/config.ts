import { config } from 'dotenv';
config(); // добавление переменных из файла .env в process.env
export const appConfig = {
  // все хардкодные значения должны быть здесь, для удобства их изменения
  PORT: process.env.PORT || 3003,
  IOC_LOG: process.env.IOC_LOG || false,
  //ADMIN: process.env.ADMIN || 'admin:qwerty',
  MONGO_URL: process.env.MONGO_URL as string,
  DB_NAME: (process.env.DB_NAME as string) || 'BlogsPosts',
  MONGO_URI:
    process.env.MONGO_URI || `mongodb://0.0.0.0:27017/${process.env.DB_NAME}`,
  BLOGS_COLLECTION_NAME: process.env.BLOGS_COLLECTION_NAME || 'Blogs',
  POSTS_COLLECTION_NAME: process.env.POSTS_COLLECTION_NAME || 'Posts',
  USERS_COLLECTION_NAME: process.env.USERS_COLLECTION_NAME || 'Users',
  COMMENTS_COLLECTION_NAME: process.env.COMMENTS_COLLECTION_NAME || 'Comments',
  REQUESTS_COLLECTION_NAME:
    process.env.REQUESTS_COLLECTION_NAME || 'RequestsLogs',
  SESSIONS_COLLECTION_NAME: process.env.SESSIONS_COLLECTION_NAME || 'Sessions',
  LIKES_COLLECTION_NAME: process.env.LIKES_COLLECTION_NAME || 'Likes',

  AT_SECRET: (process.env.DB_NAME as string) || 'f1f5deg4hy5fr5d5g',
  AT_TIME: (process.env.AT_TIME as string) || '10s',
  RT_SECRET: process.env.RT_SECRET as string,
  RT_TIME: (process.env.RT_TIME as string) || '20s',
  DB_TYPE: process.env.DB_TYPE as string,
  EMAIL: process.env.EMAIL as string,
  EMAIL_PASS: process.env.EMAIL_PASS as string,
  EMAIL_TIME: process.env.EMAIL_TIME || '1h',
  PASS_TIME: process.env.PASS_TIME || '1h',
};
//console.log(process.env.MONGO_URL)
// console.log(process.env.ADMIN)
