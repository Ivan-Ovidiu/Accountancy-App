-- ============================================================
-- Flyway Migration: Plan de conturi românesc (conform OMFP 1802/2014)
-- Toate conturile necesare pentru AccountBud
-- ============================================================
-- IMPORTANT: Rulează acest script DUPĂ ce tabelul accounts există.
-- Dacă ai deja conturi cu coduri vechi (1100, 2100, 4000, 1010),
-- șterge-le manual din Swagger/DB înainte de a rula migrarea.
-- ============================================================

-- Curăță conturile vechi cu coduri generice (dacă există)
UPDATE accounts SET is_active = 0 WHERE code IN ('1100','2100','4000','1010','3000','5000','6000');

-- ============================================================
-- CLASA 1 — Conturi de capitaluri
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('1',    'Capitaluri',                          'EQUITY',    'Clasa',    NULL, 1),
                                                                            ('10',   'Capital și rezerve',                  'EQUITY',    'Grupa',    NULL, 1),
                                                                            ('101',  'Capital social',                      'EQUITY',    'Sintetic', NULL, 1),
                                                                            ('1011', 'Capital subscris nevărsat',           'EQUITY',    'Analitic', NULL, 1),
                                                                            ('1012', 'Capital subscris vărsat',             'EQUITY',    'Analitic', NULL, 1),
                                                                            ('106',  'Rezerve',                             'EQUITY',    'Sintetic', NULL, 1),
                                                                            ('1061', 'Rezerve legale',                      'EQUITY',    'Analitic', NULL, 1),
                                                                            ('1068', 'Alte rezerve',                        'EQUITY',    'Analitic', NULL, 1),
                                                                            ('117',  'Rezultatul reportat',                 'EQUITY',    'Sintetic', NULL, 1),
                                                                            ('121',  'Profit și pierdere',                  'EQUITY',    'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 2 — Conturi de imobilizări
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('2',    'Imobilizări',                         'ASSET',     'Clasa',    NULL, 1),
                                                                            ('20',   'Imobilizări necorporale',             'ASSET',     'Grupa',    NULL, 1),
                                                                            ('205',  'Concesiuni, brevete, licențe',        'ASSET',     'Sintetic', NULL, 1),
                                                                            ('208',  'Alte imobilizări necorporale',        'ASSET',     'Sintetic', NULL, 1),
                                                                            ('21',   'Imobilizări corporale',               'ASSET',     'Grupa',    NULL, 1),
                                                                            ('211',  'Terenuri și amenajări de terenuri',   'ASSET',     'Sintetic', NULL, 1),
                                                                            ('212',  'Construcții',                         'ASSET',     'Sintetic', NULL, 1),
                                                                            ('213',  'Instalații tehnice și mașini',        'ASSET',     'Sintetic', NULL, 1),
                                                                            ('214',  'Mobilier, aparatură birotică',        'ASSET',     'Sintetic', NULL, 1),
                                                                            ('28',   'Amortizări privind imobilizările',    'ASSET',     'Grupa',    NULL, 1),
                                                                            ('281',  'Amortizări imobilizări necorporale',  'ASSET',     'Sintetic', NULL, 1),
                                                                            ('282',  'Amortizări imobilizări corporale',    'ASSET',     'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 3 — Conturi de stocuri
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('3',    'Stocuri',                             'ASSET',     'Clasa',    NULL, 1),
                                                                            ('30',   'Stocuri de materii prime',            'ASSET',     'Grupa',    NULL, 1),
                                                                            ('301',  'Materii prime',                       'ASSET',     'Sintetic', NULL, 1),
                                                                            ('302',  'Materiale consumabile',               'ASSET',     'Sintetic', NULL, 1),
                                                                            ('303',  'Materiale de natura obiectelor de inventar', 'ASSET', 'Sintetic', NULL, 1),
                                                                            ('371',  'Mărfuri',                             'ASSET',     'Sintetic', NULL, 1),
                                                                            ('378',  'Diferențe de preț la mărfuri',        'ASSET',     'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 4 — Conturi de terți
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('4',    'Conturi de terți',                    'ASSET',     'Clasa',    NULL, 1),

-- Furnizori (LIABILITY)
                                                                            ('40',   'Furnizori și conturi asimilate',      'LIABILITY', 'Grupa',    NULL, 1),
                                                                            ('401',  'Furnizori',                           'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('404',  'Furnizori de imobilizări',            'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('408',  'Furnizori — facturi nesosite',        'LIABILITY', 'Sintetic', NULL, 1),

-- Clienți (ASSET) — 4111 este contul cheie pentru facturi
                                                                            ('41',   'Clienți și conturi asimilate',        'ASSET',     'Grupa',    NULL, 1),
                                                                            ('4111', 'Clienți',                             'ASSET',     'Sintetic', NULL, 1),
                                                                            ('4118', 'Clienți incerți sau în litigii',      'ASSET',     'Sintetic', NULL, 1),
                                                                            ('419',  'Clienți — creditori',                 'LIABILITY', 'Sintetic', NULL, 1),

-- Personal
                                                                            ('42',   'Personal și conturi asimilate',       'LIABILITY', 'Grupa',    NULL, 1),
                                                                            ('421',  'Personal — salarii datorate',         'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('423',  'Personal — ajutoare materiale datorate', 'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('425',  'Avansuri acordate personalului',      'ASSET',     'Sintetic', NULL, 1),
                                                                            ('426',  'Drepturi de personal neridicate',     'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('427',  'Rețineri din salarii datorate terților', 'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('431',  'Asigurări sociale',                   'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('437',  'Ajutor de șomaj',                     'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('444',  'Impozitul pe venituri de natura salariilor', 'LIABILITY', 'Sintetic', NULL, 1),

-- Buget stat
                                                                            ('44',   'Bugetul statului și fonduri speciale', 'LIABILITY', 'Grupa',   NULL, 1),
                                                                            ('441',  'Impozitul pe profit/venit',           'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('4423', 'TVA de plată',                        'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('4424', 'TVA de recuperat',                    'ASSET',     'Sintetic', NULL, 1),
                                                                            ('4426', 'TVA deductibilă',                     'ASSET',     'Sintetic', NULL, 1),
                                                                            ('4427', 'TVA colectată',                       'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('4428', 'TVA neexigibilă',                     'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('446',  'Alte impozite și taxe',               'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('447',  'Fonduri speciale — taxe și vărsăminte asimilate', 'LIABILITY', 'Sintetic', NULL, 1),
                                                                            ('448',  'Alte datorii și creanțe cu bugetul statului', 'LIABILITY', 'Sintetic', NULL, 1),

-- Debitori / creditori diverși
                                                                            ('46',   'Debitori și creditori diverși',       'ASSET',     'Grupa',    NULL, 1),
                                                                            ('461',  'Debitori diverși',                    'ASSET',     'Sintetic', NULL, 1),
                                                                            ('462',  'Creditori diverși',                   'LIABILITY', 'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 5 — Conturi de trezorerie
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('5',    'Trezorerie',                          'ASSET',     'Clasa',    NULL, 1),
                                                                            ('51',   'Conturi la bănci',                    'ASSET',     'Grupa',    NULL, 1),
                                                                            ('5121', 'Conturi la bănci în lei',             'ASSET',     'Sintetic', NULL, 1),
                                                                            ('5124', 'Conturi la bănci în valută',          'ASSET',     'Sintetic', NULL, 1),
                                                                            ('5125', 'Sume în curs de decontare',           'ASSET',     'Sintetic', NULL, 1),
                                                                            ('53',   'Casa',                                'ASSET',     'Grupa',    NULL, 1),
                                                                            ('5311', 'Casa în lei',                         'ASSET',     'Sintetic', NULL, 1),
                                                                            ('5314', 'Casa în valută',                      'ASSET',     'Sintetic', NULL, 1),
                                                                            ('54',   'Acreditive',                          'ASSET',     'Grupa',    NULL, 1),
                                                                            ('541',  'Acreditive în lei',                   'ASSET',     'Sintetic', NULL, 1),
                                                                            ('58',   'Viramente interne',                   'ASSET',     'Grupa',    NULL, 1),
                                                                            ('581',  'Viramente interne',                   'ASSET',     'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 6 — Conturi de cheltuieli
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('6',    'Cheltuieli',                          'EXPENSE',   'Clasa',    NULL, 1),

-- Cheltuieli cu materiile prime și mărfurile
                                                                            ('60',   'Cheltuieli privind stocurile',        'EXPENSE',   'Grupa',    NULL, 1),
                                                                            ('601',  'Cheltuieli cu materii prime',         'EXPENSE',   'Sintetic', NULL, 1),
                                                                            ('602',  'Cheltuieli cu materiale consumabile', 'EXPENSE',   'Sintetic', NULL, 1),
                                                                            ('603',  'Cheltuieli privind materialele de natura obiectelor de inventar', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('607',  'Cheltuieli privind mărfurile',        'EXPENSE',   'Sintetic', NULL, 1),

-- Cheltuieli cu servicii
                                                                            ('61',   'Cheltuieli cu lucrările și serviciile executate de terți', 'EXPENSE', 'Grupa', NULL, 1),
                                                                            ('611',  'Cheltuieli cu întreținerea și reparațiile', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('612',  'Cheltuieli cu redevențele, locațiile de gestiune și chiriile', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('613',  'Cheltuieli cu primele de asigurare',  'EXPENSE',   'Sintetic', NULL, 1),
                                                                            ('614',  'Cheltuieli cu studiile și cercetările', 'EXPENSE', 'Sintetic', NULL, 1),

-- Alte cheltuieli cu servicii
                                                                            ('62',   'Cheltuieli cu alte servicii executate de terți', 'EXPENSE', 'Grupa', NULL, 1),
                                                                            ('621',  'Cheltuieli cu colaboratorii',         'EXPENSE',   'Sintetic', NULL, 1),
                                                                            ('622',  'Cheltuieli privind comisioanele și onorariile', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('623',  'Cheltuieli de protocol, reclamă și publicitate', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('624',  'Cheltuieli cu transportul de bunuri și personal', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('625',  'Cheltuieli cu deplasări, detașări și transferări', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('626',  'Cheltuieli poștale și taxe de telecomunicații', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('627',  'Cheltuieli cu serviciile bancare și asimilate', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('628',  'Alte cheltuieli cu serviciile executate de terți', 'EXPENSE', 'Sintetic', NULL, 1),

-- Cheltuieli cu personalul
                                                                            ('64',   'Cheltuieli cu personalul',            'EXPENSE',   'Grupa',    NULL, 1),
                                                                            ('641',  'Cheltuieli cu salariile personalului', 'EXPENSE',  'Sintetic', NULL, 1),
                                                                            ('642',  'Cheltuieli cu avantajele în natură acordate salariaților', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('645',  'Cheltuieli privind asigurările și protecția socială', 'EXPENSE', 'Sintetic', NULL, 1),

-- Alte cheltuieli operaționale
                                                                            ('65',   'Alte cheltuieli de exploatare',       'EXPENSE',   'Grupa',    NULL, 1),
                                                                            ('652',  'Cheltuieli cu protecția mediului înconjurător', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('654',  'Pierderi din creanțe și debitori diverși', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('658',  'Alte cheltuieli de exploatare',       'EXPENSE',   'Sintetic', NULL, 1),

-- Cheltuieli financiare
                                                                            ('66',   'Cheltuieli financiare',               'EXPENSE',   'Grupa',    NULL, 1),
                                                                            ('663',  'Pierderi din creanțe legate de participații', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('665',  'Cheltuieli din diferențe de curs valutar', 'EXPENSE', 'Sintetic', NULL, 1),
                                                                            ('666',  'Cheltuieli privind dobânzile',        'EXPENSE',   'Sintetic', NULL, 1),
                                                                            ('668',  'Alte cheltuieli financiare',          'EXPENSE',   'Sintetic', NULL, 1),

-- Cheltuieli extraordinare și cu amortizarea
                                                                            ('68',   'Cheltuieli cu amortizările, provizioanele și ajustările pentru depreciere', 'EXPENSE', 'Grupa', NULL, 1),
                                                                            ('681',  'Cheltuieli de exploatare privind amortizările și ajustările pentru depreciere', 'EXPENSE', 'Sintetic', NULL, 1);

-- ============================================================
-- CLASA 7 — Conturi de venituri
-- ============================================================
INSERT INTO accounts (code, name, type, sub_type, parent_id, is_active) VALUES
                                                                            ('7',    'Venituri',                            'REVENUE',   'Clasa',    NULL, 1),

-- Venituri din vânzări
                                                                            ('70',   'Cifra de afaceri netă',               'REVENUE',   'Grupa',    NULL, 1),
                                                                            ('701',  'Venituri din vânzarea produselor finite', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('702',  'Venituri din vânzarea semifabricatelor', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('703',  'Venituri din vânzarea produselor reziduale', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('704',  'Venituri din servicii prestate',      'REVENUE',   'Sintetic', NULL, 1),
                                                                            ('705',  'Venituri din studii și cercetări',    'REVENUE',   'Sintetic', NULL, 1),
                                                                            ('706',  'Venituri din redevențe, locații de gestiune și chirii', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('707',  'Venituri din vânzarea mărfurilor',    'REVENUE',   'Sintetic', NULL, 1),
                                                                            ('708',  'Venituri din activități diverse',     'REVENUE',   'Sintetic', NULL, 1),

-- Alte venituri operaționale
                                                                            ('74',   'Venituri din subvenții de exploatare', 'REVENUE',  'Grupa',    NULL, 1),
                                                                            ('741',  'Venituri din subvenții de exploatare aferente cifrei de afaceri', 'REVENUE', 'Sintetic', NULL, 1),

                                                                            ('75',   'Alte venituri din exploatare',        'REVENUE',   'Grupa',    NULL, 1),
                                                                            ('754',  'Venituri din creanțe reactivate și debitori diverși', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('758',  'Alte venituri din exploatare',        'REVENUE',   'Sintetic', NULL, 1),

-- Venituri financiare
                                                                            ('76',   'Venituri financiare',                 'REVENUE',   'Grupa',    NULL, 1),
                                                                            ('765',  'Venituri din diferențe de curs valutar', 'REVENUE', 'Sintetic', NULL, 1),
                                                                            ('766',  'Venituri din dobânzi',                'REVENUE',   'Sintetic', NULL, 1),
                                                                            ('768',  'Alte venituri financiare',            'REVENUE',   'Sintetic', NULL, 1);

-- ============================================================
-- Rezumat formule contabile implementate în aplicație:
--
-- FACTURĂ TRIMISĂ (Invoice → SENT):
--   DR 4111 Clienți                = total factură (cu TVA)
--   CR 704  Venituri din servicii  = subtotal (fără TVA)
--   CR 4427 TVA Colectată          = valoarea TVA
--
-- CHELTUIALĂ APROBATĂ (Expense → APPROVED):
--   DR 6xx  Cont cheltuială ales   = suma cheltuielii
--   CR 5121 Conturi la bănci       = suma cheltuielii
-- ============================================================