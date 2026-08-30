-- DSA Revision Tracker — Initial schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS dsa_revision_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dsa_revision_tracker;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  avatar_url      VARCHAR(500)  DEFAULT NULL,
  is_demo_account TINYINT(1)    NOT NULL DEFAULT 0,
  reset_token           VARCHAR(255) DEFAULT NULL,
  reset_token_expires   DATETIME     DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- problems
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
  id                  CHAR(36)      NOT NULL PRIMARY KEY,
  user_id             CHAR(36)      NOT NULL,
  leetcode_number     INT           NOT NULL,
  title               VARCHAR(255)  NOT NULL,
  difficulty          ENUM('Easy','Medium','Hard') NOT NULL,
  primary_pattern     VARCHAR(60)   NOT NULL,
  secondary_patterns  JSON          DEFAULT NULL,
  status              ENUM('Solved','Need Revision','In Revision','Mastered') NOT NULL DEFAULT 'Solved',
  date_solved         DATE          DEFAULT NULL,
  leetcode_url        VARCHAR(500)  DEFAULT NULL,
  notes               TEXT          DEFAULT NULL,
  is_favorite         TINYINT(1)    NOT NULL DEFAULT 0,
  revision_level      INT           NOT NULL DEFAULT 0,
  last_revised_at     DATETIME      DEFAULT NULL,
  next_revision_at    DATETIME      DEFAULT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_problems_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_problem UNIQUE (user_id, leetcode_number)
) ENGINE=InnoDB;

CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_problems_leetcode_number ON problems(leetcode_number);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_primary_pattern ON problems(primary_pattern);
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_next_revision_at ON problems(next_revision_at);
CREATE INDEX idx_problems_is_favorite ON problems(is_favorite);

-- ============================================================
-- revisions
-- ============================================================
CREATE TABLE IF NOT EXISTS revisions (
  id               CHAR(36)   NOT NULL PRIMARY KEY,
  user_id          CHAR(36)   NOT NULL,
  problem_id       CHAR(36)   NOT NULL,
  revision_number  INT        NOT NULL,
  revision_date    DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  result           ENUM('Remembered','Partially Remembered','Forgot') NOT NULL,
  notes            TEXT       DEFAULT NULL,
  created_at       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revisions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_revisions_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_revisions_user_id ON revisions(user_id);
CREATE INDEX idx_revisions_problem_id ON revisions(problem_id);
CREATE INDEX idx_revisions_revision_date ON revisions(revision_date);

-- ============================================================
-- practice_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id             CHAR(36)   NOT NULL PRIMARY KEY,
  user_id        CHAR(36)   NOT NULL,
  problem_id     CHAR(36)   NOT NULL,
  practice_date  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  result         ENUM('Remembered','Partially Remembered','Forgot','Solved','Not Solved','Skipped') NOT NULL,
  time_taken     INT        DEFAULT NULL COMMENT 'seconds',
  notes          TEXT       DEFAULT NULL,
  created_at     DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_practice_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_practice_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_practice_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_problem_id ON practice_sessions(problem_id);
CREATE INDEX idx_practice_date ON practice_sessions(practice_date);

-- ============================================================
-- user_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                       CHAR(36)     NOT NULL PRIMARY KEY,
  user_id                  CHAR(36)     NOT NULL,
  theme                    ENUM('dark','light','system') NOT NULL DEFAULT 'dark',
  revision_schedule        JSON         DEFAULT NULL COMMENT 'array of day-intervals, e.g. [1,3,7,14,30]',
  default_practice_count   INT          NOT NULL DEFAULT 10,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_settings_user UNIQUE (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- imports
-- ============================================================
CREATE TABLE IF NOT EXISTS imports (
  id                CHAR(36)     NOT NULL PRIMARY KEY,
  user_id           CHAR(36)     NOT NULL,
  filename          VARCHAR(255) DEFAULT NULL,
  source_type       ENUM('txt','csv','json','paste') NOT NULL,
  total_detected    INT          NOT NULL DEFAULT 0,
  total_imported    INT          NOT NULL DEFAULT 0,
  total_duplicates  INT          NOT NULL DEFAULT 0,
  total_invalid     INT          NOT NULL DEFAULT 0,
  imported_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_imports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_imports_user_id ON imports(user_id);

-- ============================================================
-- custom_lists
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_lists (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  user_id      CHAR(36)     NOT NULL,
  name         VARCHAR(120) NOT NULL,
  description  VARCHAR(500) DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_lists_user_id ON custom_lists(user_id);

-- ============================================================
-- custom_list_problems
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_list_problems (
  id          CHAR(36)  NOT NULL PRIMARY KEY,
  list_id     CHAR(36)  NOT NULL,
  problem_id  CHAR(36)  NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clp_list FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_clp_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT uq_list_problem UNIQUE (list_id, problem_id)
) ENGINE=InnoDB;

CREATE INDEX idx_clp_list_id ON custom_list_problems(list_id);
CREATE INDEX idx_clp_problem_id ON custom_list_problems(problem_id);
