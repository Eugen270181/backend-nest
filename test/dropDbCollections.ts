import { DataSource } from 'typeorm';

// Legacy MongoDB cleanup retained for reference, intentionally disabled:
// import { Connection, DeleteResult } from 'mongoose';
//
// export const dropDbCollections = async (
//   connection: Connection,
//   dataSource?: DataSource,
// ): Promise<void> => {
//   const collections = connection.collections;
//   const deletePromises: Promise<unknown>[] = [];
//   for (const key in collections) {
//     const collection = collections[key];
//     deletePromises.push(
//       collection.deleteMany({}) as Promise<DeleteResult> as Promise<unknown>,
//     );
//   }
//   if (dataSource) {
//     deletePromises.push(
//       dataSource.query(
//         'TRUNCATE TABLE users, blogs, posts, comments, comment_likes, post_likes CASCADE',
//       ),
//     );
//   }
//   await Promise.all(deletePromises);
// };

// PostgreSQL is the active database; tests clear only PostgreSQL tables.
export async function dropDbCollections(dataSource: DataSource): Promise<void> {
  const [{ database }] = await dataSource.query(
    'SELECT current_database() AS database',
  );
  if (
    process.env.NODE_ENV !== 'testing' ||
    !/(?:^|[-_])(test|testing|incubator|incubatora)(?:[-_]|$)/i.test(database)
  ) {
    throw new Error(
      'Refusing to clear a database outside the testing environment.',
    );
  }
  await dataSource.query(
    'TRUNCATE TABLE users, blogs, posts, comments, comment_likes, post_likes CASCADE',
  );
}
