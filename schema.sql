---------------------------------------------------------------------------------
-- Соглашение об именовании: в Postgres колонки в snake_case (без кавычек),
-- в TypeScript свойства в camelCase. Преобразование делает mapToUser() в репозитории.
---------------------------------------------------------------------------------
-- users: вложенные emailConfirmation / passConfirmation развёрнуты в пары колонок
CREATE TABLE IF NOT EXISTS users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login                    VARCHAR(10)  NOT NULL, -- minlength проверяет dto-валидация
    email                    VARCHAR(255) NOT NULL,
    password_hash            VARCHAR(255) NOT NULL,
    is_confirmed             BOOLEAN      NOT NULL DEFAULT FALSE,

    -- emailConfirmation: EmailConfirmation | null
    email_confirmation_code  VARCHAR(255),
    email_expiration_date    TIMESTAMPTZ,

    -- passConfirmation: PassConfirmation | null
    pass_confirmation_code   VARCHAR(255),
    pass_expiration_date     TIMESTAMPTZ,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ, -- в репозиториях есть фильтр deletedAt: null

    -- оба поля вложенного объекта либо NULL, либо заполнены вместе
    CONSTRAINT email_confirmation_consistency
        CHECK ((email_confirmation_code IS NULL) = (email_expiration_date IS NULL)),
    CONSTRAINT pass_confirmation_consistency
        CHECK ((pass_confirmation_code IS NULL) = (pass_expiration_date IS NULL))
);

-- уникальность только среди неудалённых
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_unique
    ON users (login) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON users (email) WHERE deleted_at IS NULL;

---------------------------------------------------------------------------------
-- sessions: задел на следующий шаг (сессии пока остаются в Mongo)
CREATE TABLE IF NOT EXISTS sessions (
    device_id        UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ip               VARCHAR(45)  NOT NULL,
    title            VARCHAR(255) NOT NULL,
    token_version    UUID NOT NULL,
    last_active_date TIMESTAMPTZ NOT NULL,
    exp_date         TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
---------------------------------------------------------------------------------
