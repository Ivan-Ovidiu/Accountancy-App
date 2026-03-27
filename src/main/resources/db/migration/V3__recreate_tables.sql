
CREATE TABLE users (
                       id           INT IDENTITY(1,1) PRIMARY KEY,
                       name         NVARCHAR(100)  NOT NULL,
                       email        NVARCHAR(100)  NOT NULL UNIQUE,
                       password_hash NVARCHAR(255) NOT NULL,
                       role         NVARCHAR(20)   NOT NULL DEFAULT 'VIEWER',   -- ADMIN | ACCOUNTANT | VIEWER
                       is_active    BIT            NOT NULL DEFAULT 1,
                       created_at   DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE clients (
                         id           INT IDENTITY(1,1) PRIMARY KEY,
                         name         NVARCHAR(100)  NOT NULL,
                         email        NVARCHAR(100),
                         phone        NVARCHAR(20),
                         address      NVARCHAR(255),
                         tax_id       NVARCHAR(50),
                         is_active    BIT            NOT NULL DEFAULT 1,
                         created_at   DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE accounts (
                          id          INT IDENTITY(1,1) PRIMARY KEY,
                          code        NVARCHAR(20)   NOT NULL UNIQUE,
                          name        NVARCHAR(150)  NOT NULL,
                          type        NVARCHAR(20)   NOT NULL,
                          sub_type    NVARCHAR(50),
                          parent_id   INT            REFERENCES accounts(id),
                          is_active   BIT            NOT NULL DEFAULT 1
);


CREATE TABLE tax_rates (
                           id          INT IDENTITY(1,1) PRIMARY KEY,
                           name        NVARCHAR(50)   NOT NULL,
                           rate        DECIMAL(5,2)   NOT NULL,           -- e.g. 19.00
                           type        NVARCHAR(20)   NOT NULL DEFAULT 'VAT',
                           is_default  BIT            NOT NULL DEFAULT 0,
                           is_active   BIT            NOT NULL DEFAULT 1
);


CREATE TABLE journal_entries (
                                 id               INT IDENTITY(1,1) PRIMARY KEY,
                                 user_id          INT           NOT NULL REFERENCES users(id),
                                 reference_number NVARCHAR(50)  NOT NULL UNIQUE,
                                 entry_date       DATE          NOT NULL,
                                 description      NVARCHAR(255),
                                 status           NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
                                 created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE journal_lines (
                               id               INT IDENTITY(1,1) PRIMARY KEY,
                               journal_entry_id INT           NOT NULL REFERENCES journal_entries(id),
                               account_id       INT           NOT NULL REFERENCES accounts(id),
                               debit_amount     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                               credit_amount    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                               description      NVARCHAR(255),
                               CONSTRAINT chk_journal_line_amounts CHECK (
                                   debit_amount  >= 0 AND
                                   credit_amount >= 0 AND
                                   NOT (debit_amount > 0 AND credit_amount > 0)
                                   )
);


CREATE TABLE invoices (
                          id               INT IDENTITY(1,1) PRIMARY KEY,
                          client_id        INT           NOT NULL REFERENCES clients(id),
                          user_id          INT           NOT NULL REFERENCES users(id),
                          journal_entry_id INT                    REFERENCES journal_entries(id),
                          tax_rate_id      INT                    REFERENCES tax_rates(id),
                          invoice_number   NVARCHAR(50)  NOT NULL UNIQUE,
                          issue_date       DATE          NOT NULL,
                          due_date         DATE          NOT NULL,
                          subtotal         DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                          tax_amount       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                          total            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                          status           NVARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
                          notes            NVARCHAR(500),
                          created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE invoice_items (
                               id          INT IDENTITY(1,1) PRIMARY KEY,
                               invoice_id  INT           NOT NULL REFERENCES invoices(id),
                               account_id  INT                    REFERENCES accounts(id),
                               description NVARCHAR(255) NOT NULL,
                               quantity    DECIMAL(10,2) NOT NULL,
                               unit_price  DECIMAL(18,2) NOT NULL,
                               total       DECIMAL(18,2) NOT NULL
);


CREATE TABLE expenses (
                          id               INT IDENTITY(1,1) PRIMARY KEY,
                          user_id          INT           NOT NULL REFERENCES users(id),
                          account_id       INT           NOT NULL REFERENCES accounts(id),
                          journal_entry_id INT                    REFERENCES journal_entries(id),
                          tax_rate_id      INT                    REFERENCES tax_rates(id),
                          description      NVARCHAR(255),
                          amount           DECIMAL(18,2) NOT NULL,
                          expense_date     DATE          NOT NULL,
                          receipt_url      NVARCHAR(500),
                          status           NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                          created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE bank_accounts (
                               id              INT IDENTITY(1,1) PRIMARY KEY,
                               user_id         INT           NOT NULL REFERENCES users(id),
                               account_id      INT                    REFERENCES accounts(id),  -- links to chart of accounts
                               bank_name       NVARCHAR(100) NOT NULL,
                               account_number  NVARCHAR(50)  NOT NULL,
                               account_name    NVARCHAR(150) NOT NULL,
                               current_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                               currency        NVARCHAR(3)   NOT NULL DEFAULT 'RON',
                               is_active       BIT           NOT NULL DEFAULT 1,
                               created_at      DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE bank_transactions (
                                   id                    INT IDENTITY(1,1) PRIMARY KEY,
                                   bank_account_id       INT           NOT NULL REFERENCES bank_accounts(id),
                                   journal_line_id       INT                    REFERENCES journal_lines(id),
                                   transaction_date      DATE          NOT NULL,
                                   amount                DECIMAL(18,2) NOT NULL,  -- negative = debit, positive = credit
                                   description           NVARCHAR(255),
                                   reference             NVARCHAR(100),
                                   type                  NVARCHAR(20)  NOT NULL,   -- DEBIT | CREDIT
                                   reconciliation_status NVARCHAR(20)  NOT NULL DEFAULT 'UNMATCHED',
                                   imported_at           DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE ai_suggestions (
                                id               INT IDENTITY(1,1) PRIMARY KEY,
                                user_id          INT           NOT NULL REFERENCES users(id),
                                entity_type      NVARCHAR(50)  NOT NULL,
                                entity_id        INT           NOT NULL,
                                suggestion_type  NVARCHAR(50)  NOT NULL,
                                suggestion_data  NVARCHAR(MAX) NOT NULL,  -- JSON payload
    confidence_score DECIMAL(5,2),            -- 0.00 to 100.00
    was_accepted     BIT,                     -- NULL = pending, 1 = accepted, 0 = rejected
    created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);


CREATE INDEX idx_journal_entries_date      ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_status    ON journal_entries(status);
CREATE INDEX idx_journal_lines_account     ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_entry       ON journal_lines(journal_entry_id);
CREATE INDEX idx_invoices_client           ON invoices(client_id);
CREATE INDEX idx_invoices_status           ON invoices(status);
CREATE INDEX idx_invoices_due_date         ON invoices(due_date);
CREATE INDEX idx_expenses_account          ON expenses(account_id);
CREATE INDEX idx_expenses_date             ON expenses(expense_date);
CREATE INDEX idx_bank_transactions_status  ON bank_transactions(reconciliation_status);
CREATE INDEX idx_bank_transactions_date    ON bank_transactions(transaction_date);
CREATE INDEX idx_ai_suggestions_entity     ON ai_suggestions(entity_type, entity_id);