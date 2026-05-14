-- =============================================================================
-- Adds companies table (mirrors SAGA "Configurare societati") and user_companies
-- pivot for access control. No role column on pivot — roles stay global on users.
-- =============================================================================

CREATE TABLE companies (
                           id                  INT IDENTITY(1,1) PRIMARY KEY,

    -- Identification (SAGA: Cod, Denumire, Cod fiscal, Nr. Reg. Comertului)
                           code                NVARCHAR(10)    NOT NULL UNIQUE,
                           name                NVARCHAR(150)   NOT NULL,
                           tax_id              NVARCHAR(20)    NOT NULL UNIQUE,
                           trade_register_no   NVARCHAR(30),
                           caen_code           NVARCHAR(10),
                           share_capital       DECIMAL(18,2)   NOT NULL DEFAULT 0,

    -- Sediu social (SAGA: Loc., Judet, Sector, Str., Nr., Bl., Sc., Et., Ap., Cod post.)
                           address_county      NVARCHAR(50),
                           address_city        NVARCHAR(100),
                           address_street      NVARCHAR(200),
                           address_number      NVARCHAR(20),
                           address_block       NVARCHAR(20),
                           address_entrance    NVARCHAR(10),
                           address_floor       NVARCHAR(10),
                           address_apartment   NVARCHAR(10),
                           address_sector      NVARCHAR(10),
                           address_postal_code NVARCHAR(20),

    -- Contact (SAGA: Tel., Email)
                           phone               NVARCHAR(30),
                           email               NVARCHAR(100),

    -- Banca principala (SAGA: Cont 1 + Banca 1)
                           primary_bank_iban   NVARCHAR(40),
                           primary_bank_name   NVARCHAR(100),

    -- Regim fiscal (SAGA: Modul de plata al TVA-ului, TVA la incasare, Microintreprindere)
                           vat_payer           BIT             NOT NULL DEFAULT 1,
                           vat_period          NVARCHAR(20)    NOT NULL DEFAULT 'MONTHLY',
                           vat_on_collection   BIT             NOT NULL DEFAULT 0,
                           profit_tax_type     NVARCHAR(20)    NOT NULL DEFAULT 'PROFIT',

    -- Lifecycle
                           is_active           BIT             NOT NULL DEFAULT 1,
                           created_at          DATETIME2       NOT NULL DEFAULT SYSDATETIME(),

                           CONSTRAINT chk_companies_vat_period       CHECK (vat_period IN ('MONTHLY','QUARTERLY','NONE')),
                           CONSTRAINT chk_companies_profit_tax_type  CHECK (profit_tax_type IN ('PROFIT','MICRO'))
);

CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_code      ON companies(code);


CREATE TABLE user_companies (
                                id          INT IDENTITY(1,1) PRIMARY KEY,
                                user_id     INT          NOT NULL REFERENCES users(id),
                                company_id  INT          NOT NULL REFERENCES companies(id),
                                is_default  BIT          NOT NULL DEFAULT 0,
                                created_at  DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
                                CONSTRAINT uq_user_companies UNIQUE (user_id, company_id)
);

CREATE INDEX idx_user_companies_user    ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);