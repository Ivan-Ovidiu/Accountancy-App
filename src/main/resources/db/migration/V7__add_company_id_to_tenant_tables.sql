-- =============================================================================
-- V5: Add company_id to all tenant-aware tables
-- Strategy: add nullable, backfill with default company, then make NOT NULL.
-- Default company is seeded in V6 first, but since Flyway runs migrations in
-- order, we seed here to keep DDL+DML co-located per concern.
-- =============================================================================

-- 1) Seed a default company so we can backfill existing data without violating
--    NOT NULL. Replace this with your real first company through the UI later;
--    just don't delete it until you've reassigned everything.
INSERT INTO companies (
    code, name, tax_id, trade_register_no, caen_code, share_capital,
    address_county, address_city, address_street, address_number,
    address_block, address_entrance, address_floor, address_apartment, address_sector,
    phone,
    vat_payer, vat_period, vat_on_collection, profit_tax_type,
    is_active
) VALUES (
             '0001',
             'S.C. ILLUSTRA GROUP ARCHITECTS SRL',
             'RO34314954',
             'J40/8535/2019',
             '7111',
             200.00,
             'BUCURESTI', 'BUCURESTI', 'TUZLA', '1',
             '11', 'A', '3', '9', '2',
             '0742028207',
             1, 'MONTHLY', 1, 'PROFIT',
             1
         );

-- We'll need this id repeatedly. SQL Server doesn't have a clean cross-statement
-- variable in plain Flyway scripts, so use a deterministic lookup by code.

-- 2) Grant the existing admin (and any other existing users) access to it.
INSERT INTO user_companies (user_id, company_id, is_default)
SELECT u.id, c.id, 1
FROM users u
         CROSS JOIN companies c
WHERE c.code = '0001';

-- 3) Add company_id columns. Add NULL first, backfill, then NOT NULL.
ALTER TABLE clients          ADD company_id INT NULL;
ALTER TABLE accounts         ADD company_id INT NULL;
ALTER TABLE tax_rates        ADD company_id INT NULL;
ALTER TABLE journal_entries  ADD company_id INT NULL;
ALTER TABLE journal_lines    ADD company_id INT NULL;
ALTER TABLE invoices         ADD company_id INT NULL;
ALTER TABLE expenses         ADD company_id INT NULL;
ALTER TABLE bank_accounts    ADD company_id INT NULL;
ALTER TABLE bank_transactions ADD company_id INT NULL;
ALTER TABLE ai_suggestions   ADD company_id INT NULL;
GO

-- 4) Backfill every existing row to the default company.
DECLARE @defaultCompanyId INT = (SELECT id FROM companies WHERE code = '0001');

UPDATE clients          SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE accounts         SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE tax_rates        SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE journal_entries  SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE journal_lines    SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE invoices         SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE expenses         SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE bank_accounts    SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE bank_transactions SET company_id = @defaultCompanyId WHERE company_id IS NULL;
UPDATE ai_suggestions   SET company_id = @defaultCompanyId WHERE company_id IS NULL;
GO

-- 5) Now lock them down: NOT NULL + FK + index.
ALTER TABLE clients          ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE accounts         ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE tax_rates        ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE journal_entries  ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE journal_lines    ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE invoices         ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE expenses         ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE bank_accounts    ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE bank_transactions ALTER COLUMN company_id INT NOT NULL;
ALTER TABLE ai_suggestions   ALTER COLUMN company_id INT NOT NULL;
GO

ALTER TABLE clients           ADD CONSTRAINT fk_clients_company           FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE accounts          ADD CONSTRAINT fk_accounts_company          FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE tax_rates         ADD CONSTRAINT fk_tax_rates_company         FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE journal_entries   ADD CONSTRAINT fk_journal_entries_company   FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE journal_lines     ADD CONSTRAINT fk_journal_lines_company     FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE invoices          ADD CONSTRAINT fk_invoices_company          FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE expenses          ADD CONSTRAINT fk_expenses_company          FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE bank_accounts     ADD CONSTRAINT fk_bank_accounts_company     FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE bank_transactions ADD CONSTRAINT fk_bank_transactions_company FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE ai_suggestions    ADD CONSTRAINT fk_ai_suggestions_company    FOREIGN KEY (company_id) REFERENCES companies(id);

CREATE INDEX idx_clients_company           ON clients(company_id);
CREATE INDEX idx_accounts_company          ON accounts(company_id);
CREATE INDEX idx_tax_rates_company         ON tax_rates(company_id);
CREATE INDEX idx_journal_entries_company   ON journal_entries(company_id);
CREATE INDEX idx_journal_lines_company     ON journal_lines(company_id);
CREATE INDEX idx_invoices_company          ON invoices(company_id);
CREATE INDEX idx_expenses_company          ON expenses(company_id);
CREATE INDEX idx_bank_accounts_company     ON bank_accounts(company_id);
CREATE INDEX idx_bank_transactions_company ON bank_transactions(company_id);
CREATE INDEX idx_ai_suggestions_company    ON ai_suggestions(company_id);



-- The constraint names above are auto-generated by SQL Server and will differ
-- on your DB. Use this to find and drop the real ones:
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(t.name)
    + ' DROP CONSTRAINT ' + QUOTENAME(kc.name) + '; '
FROM sys.key_constraints kc
         JOIN sys.tables t ON kc.parent_object_id = t.object_id
         JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id
    AND ic.index_id  = kc.unique_index_id
         JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE kc.type = 'UQ'
  AND t.name IN ('accounts','journal_entries','invoices')
  AND c.name IN ('code','reference_number','invoice_number')
  AND (SELECT COUNT(*) FROM sys.index_columns ic2
       WHERE ic2.object_id = kc.parent_object_id
         AND ic2.index_id  = kc.unique_index_id) = 1;

EXEC sp_executesql @sql;
GO

-- Recreate as composite (now unique within a company, not globally).
ALTER TABLE accounts        ADD CONSTRAINT uq_accounts_code_company             UNIQUE (code, company_id);
ALTER TABLE journal_entries ADD CONSTRAINT uq_journal_entries_reference_company UNIQUE (reference_number, company_id);
ALTER TABLE invoices        ADD CONSTRAINT uq_invoices_number_company           UNIQUE (invoice_number, company_id);