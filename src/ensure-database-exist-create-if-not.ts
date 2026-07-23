// Создаёт базу, если её нет: коннектимся к системной базе postgres,
// она есть в любом кластере, и оттуда делаем CREATE DATABASE
import { Client } from 'pg';
import { Logger } from '@nestjs/common';

export async function ensureDatabaseExistCreateIfNot(
  pgUri: string,
  logger: Logger,
): Promise<void> {
  const urlObj = new URL(pgUri);
  const targetDbName = decodeURIComponent(urlObj.pathname.slice(1));

  urlObj.pathname = '/postgres';
  const client = new Client({ connectionString: urlObj.toString() });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName],
    );

    if (!result.rowCount) {
      // фикс № 4: rowCount у pg имеет тип number | null
      logger.log(`База [${targetDbName}] не найдена. Создаю...`);
      // имя базы нельзя передать как $1 — экранируем кавычки вручную
      await client.query(
        `CREATE DATABASE "${targetDbName.replace(/"/g, '""')}"`,
      );
      logger.log(`База [${targetDbName}] создана`);
    } else {
      logger.log(`База [${targetDbName}] уже существует`);
    }
  } catch (error) {
    // фикс № 3: error в catch имеет тип unknown — сужаем через instanceof
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Ошибка при проверке/создании базы: ${message}`);
    throw error;
  } finally {
    await client.end();
  }
}
