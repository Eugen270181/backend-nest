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

  //юзеры теперь живут в Postgres: чистим и их (CASCADE зацепит sessions, когда переедут)
  if (dataSource) {
    deletePromises.push(dataSource.query('TRUNCATE TABLE users CASCADE'));
  }

  await Promise.all(deletePromises);
};
