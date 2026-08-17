import { Connection, DeleteResult } from 'mongoose';
import { DataSource } from 'typeorm';

export const dropDbCollections = async (
  connection: Connection,
  dataSource?: DataSource,
): Promise<void> => {
  const collections = connection.collections;
  const deletePromises: Promise<unknown>[] = [];

  for (const key in collections) {
    const collection = collections[key];
    deletePromises.push(
      collection.deleteMany({}) as Promise<DeleteResult> as Promise<unknown>,
    );
  }

  //users и sessions теперь живут в Postgres: CASCADE чистит sessions вместе с users
  if (dataSource) {
    deletePromises.push(dataSource.query('TRUNCATE TABLE users CASCADE'));
  }

  await Promise.all(deletePromises);
};
