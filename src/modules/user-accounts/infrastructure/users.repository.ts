import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, UserDocument } from '../domain/user.entity';
import { CoreConfig } from '../../../core/core.config';

@Injectable()
export class UsersRepository {
  constructor(
    private coreConfig: CoreConfig,
    private readonly dataSource: DataSource,
  ) {
    if (this.coreConfig.IOC_LOG) console.log('UsersRepository created');
  }

  //строка таблицы (snake_case) -> доменная сущность (camelCase),
  //вложенные объекты собираются обратно из пар колонок
  private mapToUser(row: any): User {
    const user = new User();

    user.id = row.id;
    user.login = row.login;
    user.email = row.email;
    user.passwordHash = row.password_hash;
    user.isConfirmed = row.is_confirmed;

    user.emailConfirmation = row.email_confirmation_code
      ? {
          confirmationCode: row.email_confirmation_code,
          expirationDate: row.email_expiration_date,
        }
      : null;

    user.passConfirmation = row.pass_confirmation_code
      ? {
          confirmationCode: row.pass_confirmation_code,
          expirationDate: row.pass_expiration_date,
        }
      : null;

    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    user.deletedAt = row.deleted_at;

    return user;
  }

  //общий поиск: where — только наши строки-константы,
  //пользовательские значения — строго через параметры $1/$2 (защита от SQL-инъекций)
  private async findOne(
    where: string,
    params: unknown[],
  ): Promise<UserDocument | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM users WHERE ${where} LIMIT 1`,
      params,
    );
    return rows.length ? this.mapToUser(rows[0]) : null;
  }

  async save(user: UserDocument): Promise<void> {
    if (!user.id) {
      //новый юзер -> INSERT, база сама генерирует id/created_at/updated_at,
      //RETURNING пишет их обратно в объект (аналог того, что Mongo клал _id при save)
      const rows = await this.dataSource.query(
        `INSERT INTO users
           (login, email, password_hash, is_confirmed,
            email_confirmation_code, email_expiration_date,
            pass_confirmation_code, pass_expiration_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at, updated_at`,
        [
          user.login,
          user.email,
          user.passwordHash,
          user.isConfirmed,
          user.emailConfirmation?.confirmationCode ?? null,
          user.emailConfirmation?.expirationDate ?? null,
          user.passConfirmation?.confirmationCode ?? null,
          user.passConfirmation?.expirationDate ?? null,
        ],
      );
      user.id = rows[0].id;
      user.createdAt = rows[0].created_at;
      user.updatedAt = rows[0].updated_at;
    } else {
      //существующий -> UPDATE; updated_at обновляем вручную (плагина timestamps больше нет)
      await this.dataSource.query(
        `UPDATE users SET
           login = $2, email = $3, password_hash = $4, is_confirmed = $5,
           email_confirmation_code = $6, email_expiration_date = $7,
           pass_confirmation_code = $8, pass_expiration_date = $9,
           deleted_at = $10, updated_at = now()
         WHERE id = $1`,
        [
          user.id,
          user.login,
          user.email,
          user.passwordHash,
          user.isConfirmed,
          user.emailConfirmation?.confirmationCode ?? null,
          user.emailConfirmation?.expirationDate ?? null,
          user.passConfirmation?.confirmationCode ?? null,
          user.passConfirmation?.expirationDate ?? null,
          user.deletedAt,
        ],
      );
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await this.findOne('id = $1 AND deleted_at IS NULL', [id]);
    } catch (e) {
      //22P02 = invalid_text_representation (невалидный uuid) — аналог CastError в Mongo
      if ((e as { code?: string })?.code === '22P02') return null;
      throw e; //обрыв коннекта и пр. → 500
    }
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.findOne('login = $1', [login]);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne('email = $1', [email]);
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.findOne('(login = $1 OR email = $1)', [loginOrEmail]);
  }

  async findUserByRegConfirmCode(code: string): Promise<UserDocument | null> {
    return this.findOne('email_confirmation_code = $1', [code]);
  }

  async findUserByPassConfirmCode(code: string): Promise<UserDocument | null> {
    return this.findOne('pass_confirmation_code = $1', [code]);
  }

  async deleteUserById(id: string) {
    //паритет с прежним deleteOne — жёсткое удаление
    await this.dataSource.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
