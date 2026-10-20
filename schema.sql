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
-- sessions: PK device_id генерируется приложением (uuid v4) при логине,
-- поэтому save() в репозитории — UPSERT по device_id
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

---------------------------------------------------------------------------------
-- blogs: мягкое удаление через deleted_at (как у users)
CREATE TABLE IF NOT EXISTS blogs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(15)  NOT NULL, -- max длину проверяет dto-валидация
    description   VARCHAR(500) NOT NULL,
    website_url   VARCHAR(100) NOT NULL,
    is_membership BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

---------------------------------------------------------------------------------
-- posts: blogName в таблице НЕ хранится (в Mongo было денормализовано) -
-- имя блога берём JOIN-ом из blogs, поэтому после переименования блога
-- во всех его постах сразу актуальное blogName.
-- Лайки/дизлайки пока не в SQL: во view они отдаются заглушкой (0 / None / []).
-- FK без ON DELETE CASCADE: блоги удаляются мягко (deleted_at), каскад не нужен.
CREATE TABLE IF NOT EXISTS posts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id           UUID          NOT NULL REFERENCES blogs (id),
    title             VARCHAR(30)   NOT NULL,
    short_description VARCHAR(100)  NOT NULL,
    content           VARCHAR(1000) NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

-- если таблица posts уже была создана ранней версией схемы (с blog_name и счётчиками
-- лайков) - приводим её к актуальному виду. Для чистой базы это no-op.
ALTER TABLE posts DROP COLUMN IF EXISTS blog_name;
ALTER TABLE posts DROP COLUMN IF EXISTS likes_count;
ALTER TABLE posts DROP COLUMN IF EXISTS dislikes_count;

DROP INDEX IF EXISTS idx_posts_blog_id;
-- посты блога: фильтр по blog_id + сортировка по createdAt, только неудалённые
CREATE INDEX IF NOT EXISTS idx_posts_blog_id_created_at
    ON posts (blog_id, created_at DESC) WHERE deleted_at IS NULL;

---------------------------------------------------------------------------------
-- comments: мягкое удаление через deleted_at.
-- userLogin в таблице НЕ хранится - берём JOIN-ом из users (как blogName у постов).
-- Счётчиков лайков тоже нет: likesCount/dislikesCount считаются из comment_likes,
-- поэтому рассинхронизироваться им не с чем.
-- Удаление пользователя (DELETE FROM users) каскадно удаляет его комментарии и лайки.
CREATE TABLE IF NOT EXISTS comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID         NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    VARCHAR(300) NOT NULL, -- min/max проверяет dto-валидация
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- комментарии поста: фильтр по post_id + сортировка по createdAt, только неудалённые
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at
    ON comments (post_id, created_at DESC) WHERE deleted_at IS NULL;

---------------------------------------------------------------------------------
-- Лайки: одна строка = текущая реакция пользователя. PK (объект, пользователь)
-- гарантирует «один пользователь - одна реакция».
-- Статус None в таблице не хранится: сброс реакции = DELETE строки.
-- updated_at = момент последней смены статуса (по нему строится newestLikes).
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id UUID        NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status     VARCHAR(7)  NOT NULL CHECK (status IN ('Like', 'Dislike')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id    UUID        NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status     VARCHAR(7)  NOT NULL CHECK (status IN ('Like', 'Dislike')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- newestLikes: последние лайки поста (status = 'Like') по времени
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id_status_updated_at
    ON post_likes (post_id, status, updated_at DESC);
