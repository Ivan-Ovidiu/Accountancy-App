-- ============================================================
-- V7: Furnizori si Facturi Primite de la Furnizori
-- ============================================================

CREATE TABLE suppliers (
                           id          INT IDENTITY(1,1) PRIMARY KEY,
                           name        NVARCHAR(100) NOT NULL,
                           email       NVARCHAR(100),
                           phone       NVARCHAR(20),
                           address     NVARCHAR(255),
                           tax_id      NVARCHAR(50),
                           is_active   BIT NOT NULL DEFAULT 1,
                           created_at  DATETIME DEFAULT GETDATE()
);

CREATE TABLE supplier_invoices (
                                   id                  INT IDENTITY(1,1) PRIMARY KEY,
                                   supplier_id         INT NOT NULL FOREIGN KEY REFERENCES suppliers(id),
                                   user_id             INT NOT NULL FOREIGN KEY REFERENCES users(id),
                                   expense_account_id  INT NOT NULL FOREIGN KEY REFERENCES accounts(id),
                                   tax_rate_id         INT FOREIGN KEY REFERENCES tax_rates(id),
                                   journal_entry_id    INT FOREIGN KEY REFERENCES journal_entries(id),
                                   payment_journal_entry_id INT FOREIGN KEY REFERENCES journal_entries(id),

    -- Numarul facturii de la furnizor (ex: FA-2026-001)
                                   invoice_number      NVARCHAR(50) NOT NULL,
                                   issue_date          DATE NOT NULL,
                                   due_date            DATE NOT NULL,
                                   subtotal            DECIMAL(18,2) NOT NULL DEFAULT 0,
                                   vat_amount          DECIMAL(18,2) NOT NULL DEFAULT 0,
                                   total               DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- PENDING  = inregistrata, neplătita
    -- PAID     = plătita (401 = 5121 posted)
    -- OVERDUE  = depasit termenul
    -- VOID     = anulata
                                   status              NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
                                   notes               NVARCHAR(500),
                                   created_at          DATETIME DEFAULT GETDATE()
);

-- Operatiuni diverse de banca (comisioane, dobanzi, etc.)
CREATE TABLE bank_operations (
                                 id                  INT IDENTITY(1,1) PRIMARY KEY,
                                 bank_account_id     INT NOT NULL FOREIGN KEY REFERENCES bank_accounts(id),
                                 user_id             INT NOT NULL FOREIGN KEY REFERENCES users(id),
                                 debit_account_id    INT NOT NULL FOREIGN KEY REFERENCES accounts(id),
                                 credit_account_id   INT NOT NULL FOREIGN KEY REFERENCES accounts(id),
                                 journal_entry_id    INT FOREIGN KEY REFERENCES journal_entries(id),

    -- TIP operatiune
    -- COMMISSION   = comision bancar (627 = 5121)
    -- INTEREST_EXP = dobanda platita (666 = 5121)
    -- INTEREST_INC = dobanda incasata (5121 = 766)
    -- OTHER        = alta operatiune
                                 operation_type      NVARCHAR(30) NOT NULL DEFAULT 'OTHER',
                                 description         NVARCHAR(255) NOT NULL,
                                 amount              DECIMAL(18,2) NOT NULL,
                                 operation_date      DATE NOT NULL,
                                 created_at          DATETIME DEFAULT GETDATE()
);