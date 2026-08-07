---------------------------------------------------------------------------------
-- users: вложенные emailConfirmation / passConfirmation развёрнуты в пары колонок
CREATE TABLE IF NOT EXISTS users (
                                     "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "login"                     VARCHAR(10)  NOT NULL,        -- minlength проверяет dto-валидация
    "email"                     VARCHAR(255) NOT NULL,
    "passwordHash"              VARCHAR(255) NOT NULL,
    "isConfirmed"               BOOLEAN      NOT NULL DEFAULT FALSE,

    -- emailConfirmation: EmailConfirmation | null
    "emailConfirmationCode"     VARCHAR(255),
    "emailExpirationDate"       TIMESTAMPTZ,

    -- passConfirmation: PassConfirmation | null
    "passConfirmationCode"      VARCHAR(255),
    "passExpirationDate"        TIMESTAMPTZ,

    "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deletedAt"                 TIMESTAMPTZ,   -- у тебя в репозиториях есть фильтр deletedAt: null

-- оба поля вложенного объекта либо NULL, либо заполнены вместе
    CONSTRAINT "emailConfirmationConsistency"
    CHECK (("emailConfirmationCode" IS NULL) = ("emailExpirationDate" IS NULL)),
    CONSTRAINT "passConfirmationConsistency"
    CHECK (("passConfirmationCode" IS NULL) = ("passExpirationDate" IS NULL))
    );

-- уникальность только среди неудалённых
CREATE UNIQUE INDEX IF NOT EXISTS "idxUsersLoginUnique"
    ON users ("login") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idxUsersEmailUnique"
    ON users ("email") WHERE "deletedAt" IS NULL;
---------------------------------------------------------------------------------
-- sessions: поля из твоего session.entity.ts как есть
CREATE TABLE IF NOT EXISTS sessions (
                                        "deviceId"        UUID PRIMARY KEY,
                                        "userId"          UUID NOT NULL REFERENCES users ("id") ON DELETE CASCADE,
    "ip"              VARCHAR(45)  NOT NULL,
    "title"           VARCHAR(255) NOT NULL,
    "tokenVersion"    UUID NOT NULL,
    "lastActiveDate"  TIMESTAMPTZ NOT NULL,
    "expDate"         TIMESTAMPTZ NOT NULL
    );

CREATE INDEX IF NOT EXISTS "idxSessionsUserId" ON sessions ("userId");
---------------------------------------------------------------------------------
