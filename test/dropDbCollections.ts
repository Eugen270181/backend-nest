import { Connection, DeleteResult } from 'mongoose';

export const dropDbCollections = async (
  connection: Connection,
): Promise<void> => {
  const collections = connection.collections;
  const deletePromises: Promise<DeleteResult>[] = [];

  for (const key in collections) {
    const collection = collections[key];
    deletePromises.push(collection.deleteMany({}));
  }

  await Promise.all(deletePromises);
};
