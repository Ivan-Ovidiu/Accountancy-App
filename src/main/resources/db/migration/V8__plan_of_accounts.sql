-- V9: Seed global chart of accounts — OMFP 1802/2014 (societati comerciale)
-- All accounts are global (no company_id) as of V8 migration

SET NOCOUNT ON;

-- ============================================================
-- CLASA 1 — Conturi de capitaluri, provizioane, imprumuturi
-- ============================================================

-- 10. Capital si rezerve
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('101', 'Capital', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1011', 'Capital subscris nevarsat', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1012', 'Capital subscris varsat', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1015', 'Patrimoniul regiei', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1016', 'Patrimoniul public', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1017', 'Patrimoniul privat', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1018', 'Patrimoniul institutelor nationale de cercetare-dezvoltare', 'EQUITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('103', 'Alte elemente de capitaluri proprii', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1031', 'Beneficii acordate angajatilor sub forma instrumentelor de capitaluri proprii', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1033', 'Diferente de curs valutar in relatie cu investitia neta intr-o entitate straina', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1038', 'Diferente din modificarea valorii juste a activelor financiare disponibile in vederea vanzarii', 'EQUITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('104', 'Prime de capital', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1041', 'Prime de emisiune', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1042', 'Prime de fuziune/divizare', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1043', 'Prime de aport', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1044', 'Prime de conversie a obligatiunilor in actiuni', 'EQUITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('105', 'Rezerve din reevaluare', 'EQUITY', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('106', 'Rezerve', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1061', 'Rezerve legale', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1063', 'Rezerve statutare sau contractuale', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1068', 'Alte rezerve', 'EQUITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('107', 'Diferente de curs valutar din conversie', 'EQUITY', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('108', 'Interese care nu controleaza', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1081', 'Interese care nu controleaza - rezultatul exercitiului financiar', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1082', 'Interese care nu controleaza - alte capitaluri proprii', 'EQUITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('109', 'Actiuni proprii', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1091', 'Actiuni proprii detinute pe termen scurt', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1092', 'Actiuni proprii detinute pe termen lung', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1095', 'Actiuni proprii reprezentand titluri detinute de societatea absorbita la societatea absorbanta', 'ASSET', 'Analitic', 1);

-- 11. Rezultatul reportat
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('117', 'Rezultatul reportat', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1171', 'Rezultatul reportat reprezentand profitul nerepartizat sau pierderea neacoperita', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1172', 'Rezultatul reportat provenit din adoptarea pentru prima data a IAS', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1173', 'Rezultatul reportat provenit din modificarile politicilor contabile', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1174', 'Rezultatul reportat provenit din corectarea erorilor contabile', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1175', 'Rezultatul reportat reprezentand surplusul realizat din rezerve din reevaluare', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1176', 'Rezultatul reportat provenit din trecerea la aplicarea reglementarilor contabile conforme cu directivele europene', 'EQUITY', 'Analitic', 1);

-- 12. Rezultatul exercitiului financiar
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('121', 'Profit sau pierdere', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('129', 'Repartizarea profitului', 'ASSET', 'Sintetic', 1);

-- 14. Castiguri sau pierderi legate de instrumente de capitaluri proprii
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('141', 'Castiguri legate de vanzarea sau anularea instrumentelor de capitaluri proprii', 'EQUITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1411', 'Castiguri legate de vanzarea instrumentelor de capitaluri proprii', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1412', 'Castiguri legate de anularea instrumentelor de capitaluri proprii', 'EQUITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('149', 'Pierderi legate de instrumente de capitaluri proprii', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1491', 'Pierderi rezultate din vanzarea instrumentelor de capitaluri proprii', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1495', 'Pierderi rezultate din reorganizari, care sunt determinate de anularea titlurilor detinute', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1496', 'Pierderi rezultate din reorganizari de societati, corespunzatoare activului net negativ al societatii absorbite', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1498', 'Alte pierderi legate de instrumentele de capitaluri proprii', 'ASSET', 'Analitic', 1);

-- 15. Provizioane
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('151', 'Provizioane', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1511', 'Provizioane pentru litigii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1512', 'Provizioane pentru garantii acordate clientilor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1513', 'Provizioane pentru dezafectare imobilizari corporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1514', 'Provizioane pentru restructurare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1515', 'Provizioane pentru pensii si obligatii similare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1516', 'Provizioane pentru impozite', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1517', 'Provizioane pentru terminarea contractului de munca', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1518', 'Alte provizioane', 'LIABILITY', 'Analitic', 1);

-- 16. Imprumuturi si datorii asimilate
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('161', 'Imprumuturi din emisiuni de obligatiuni', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1614', 'Imprumuturi externe din emisiuni de obligatiuni garantate de stat', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1615', 'Imprumuturi externe din emisiuni de obligatiuni garantate de banci', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1617', 'Imprumuturi interne din emisiuni de obligatiuni garantate de stat', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1618', 'Alte imprumuturi din emisiuni de obligatiuni', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('162', 'Credite bancare pe termen lung', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1621', 'Credite bancare pe termen lung', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1622', 'Credite bancare pe termen lung nerambursate la scadenta', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1623', 'Credite externe guvernamentale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1624', 'Credite bancare externe garantate de stat', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1625', 'Credite bancare externe garantate de banci', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1626', 'Credite de la trezoreria statului', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1627', 'Credite bancare interne garantate de stat', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('166', 'Datorii care privesc imobilizarile financiare', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1661', 'Datorii fata de entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1663', 'Datorii fata de entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('167', 'Alte imprumuturi si datorii asimilate', 'LIABILITY', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('168', 'Dobanzi aferente imprumuturilor si datoriilor asimilate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1681', 'Dobanzi aferente imprumuturilor din emisiuni de obligatiuni', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1682', 'Dobanzi aferente creditelor bancare pe termen lung', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1685', 'Dobanzi aferente datoriilor fata de entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1686', 'Dobanzi aferente datoriilor fata de entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1687', 'Dobanzi aferente altor imprumuturi si datorii asimilate', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('169', 'Prime privind rambursarea obligatiunilor si a altor datorii', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1691', 'Prime privind rambursarea obligatiunilor', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('1692', 'Prime privind rambursarea altor datorii', 'ASSET', 'Analitic', 1);

-- ============================================================
-- CLASA 2 — Conturi de imobilizari
-- ============================================================

-- 20. Imobilizari necorporale
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('201', 'Cheltuieli de constituire', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('203', 'Cheltuieli de dezvoltare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('205', 'Concesiuni, brevete, licente, marci comerciale, drepturi si active similare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('206', 'Active necorporale de explorare si evaluare a resurselor minerale', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('207', 'Fond comercial', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2071', 'Fond comercial pozitiv', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2075', 'Fond comercial negativ', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('208', 'Alte imobilizari necorporale', 'ASSET', 'Sintetic', 1);

-- 21. Imobilizari corporale
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('211', 'Terenuri si amenajari de terenuri', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2111', 'Terenuri', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2112', 'Amenajari de terenuri', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('212', 'Constructii', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('213', 'Instalatii tehnice si mijloace de transport', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2131', 'Echipamente tehnologice (masini, utilaje si instalatii de lucru)', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2132', 'Aparate si instalatii de masurare, control si reglare', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2133', 'Mijloace de transport', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('214', 'Mobilier, aparatura birotica, echipamente de protectie si alte active corporale', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('215', 'Investitii imobiliare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('216', 'Active corporale de explorare si evaluare a resurselor minerale', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('217', 'Active biologice productive', 'ASSET', 'Sintetic', 1);

-- 22. Imobilizari corporale in curs de aprovizionare
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('223', 'Instalatii tehnice si mijloace de transport in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('224', 'Mobilier si aparatura birotica in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('227', 'Active biologice productive in curs de aprovizionare', 'ASSET', 'Sintetic', 1);

-- 23. Imobilizari in curs
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('231', 'Imobilizari corporale in curs de executie', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('235', 'Investitii imobiliare in curs de executie', 'ASSET', 'Sintetic', 1);

-- 26. Imobilizari financiare
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('261', 'Actiuni detinute la entitatile afiliate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('262', 'Actiuni detinute la entitati asociate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('263', 'Actiuni detinute la entitati controlate in comun', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('265', 'Alte titluri imobilizate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('266', 'Certificate verzi amanate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('267', 'Creante imobilizate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2671', 'Sume de incasat de la entitatile afiliate', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2672', 'Dobanda aferenta sumelor de incasat de la entitatile afiliate', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2673', 'Creante fata de entitatile asociate si entitatile controlate in comun', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2675', 'Imprumuturi acordate pe termen lung', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2676', 'Dobanda aferenta imprumuturilor acordate pe termen lung', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2677', 'Obligatiuni achizitionate cu ocazia emisiunilor efectuate de terti', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2678', 'Alte creante imobilizate', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2679', 'Dobanzi aferente altor creante imobilizate', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('269', 'Varsamente de efectuat pentru imobilizari financiare', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2691', 'Varsamente de efectuat privind actiunile detinute la entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2692', 'Varsamente de efectuat privind actiunile detinute la entitati asociate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2695', 'Varsamente de efectuat pentru alte imobilizari financiare', 'LIABILITY', 'Analitic', 1);

-- 28. Amortizari privind imobilizarile
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('280', 'Amortizari privind imobilizarile necorporale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2801', 'Amortizarea cheltuielilor de constituire', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2803', 'Amortizarea cheltuielilor de dezvoltare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2805', 'Amortizarea concesiunilor, brevetelor, licentelor, marcilor comerciale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2806', 'Amortizarea activelor necorporale de explorare si evaluare a resurselor minerale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2807', 'Amortizarea fondului comercial', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2808', 'Amortizarea altor imobilizari necorporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('281', 'Amortizari privind imobilizarile corporale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2811', 'Amortizarea amenajarii de terenuri', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2812', 'Amortizarea constructiilor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2813', 'Amortizarea instalatiilor si mijloacelor de transport', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2814', 'Amortizarea altor imobilizari corporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2815', 'Amortizarea investitiilor imobiliare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2816', 'Amortizarea activelor corporale de explorare si evaluare a resurselor minerale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2817', 'Amortizarea activelor biologice productive', 'LIABILITY', 'Analitic', 1);

-- 29. Ajustari pentru deprecierea imobilizarilor
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('290', 'Ajustari pentru deprecierea imobilizarilor necorporale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2903', 'Ajustari pentru deprecierea cheltuielilor de dezvoltare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2905', 'Ajustari pentru deprecierea concesiunilor, brevetelor, licentelor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2906', 'Ajustari pentru deprecierea activelor necorporale de explorare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2908', 'Ajustari pentru deprecierea altor imobilizari necorporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('291', 'Ajustari pentru deprecierea imobilizarilor corporale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2911', 'Ajustari pentru deprecierea terenurilor si amenajarilor de terenuri', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2912', 'Ajustari pentru deprecierea constructiilor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2913', 'Ajustari pentru deprecierea instalatiilor si mijloacelor de transport', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2914', 'Ajustari pentru deprecierea altor imobilizari corporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2915', 'Ajustari pentru deprecierea investitiilor imobiliare', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2916', 'Ajustari pentru deprecierea activelor corporale de explorare si evaluare a resurselor minerale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2917', 'Ajustari pentru deprecierea activelor biologice productive', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('293', 'Ajustari pentru deprecierea imobilizarilor in curs de executie', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2931', 'Ajustari pentru deprecierea imobilizarilor corporale in curs de executie', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2935', 'Ajustari pentru deprecierea investitiilor imobiliare in curs de executie', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('296', 'Ajustari pentru pierderea de valoare a imobilizarilor financiare', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2961', 'Ajustari pentru pierderea de valoare a actiunilor detinute la entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2962', 'Ajustari pentru pierderea de valoare a actiunilor detinute la entitati asociate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2963', 'Ajustari pentru pierderea de valoare a altor titluri imobilizate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2966', 'Ajustari pentru pierderea de valoare a imprumuturilor acordate pe termen lung', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2968', 'Ajustari pentru pierderea de valoare a altor creante imobilizate', 'LIABILITY', 'Analitic', 1);

-- ============================================================
-- CLASA 3 — Conturi de stocuri si productie in curs de executie
-- ============================================================

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('301', 'Materii prime', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('302', 'Materiale consumabile', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3021', 'Materiale auxiliare', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3022', 'Combustibili', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3023', 'Materiale pentru ambalat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3024', 'Piese de schimb', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3025', 'Seminte si materiale de plantat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3026', 'Furaje', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3028', 'Alte materiale consumabile', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('303', 'Materiale de natura obiectelor de inventar', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('308', 'Diferente de pret la materii prime si materiale', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('321', 'Materii prime in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('322', 'Materiale consumabile in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('323', 'Materiale de natura obiectelor de inventar in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('326', 'Active biologice de natura stocurilor in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('327', 'Marfuri in curs de aprovizionare', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('328', 'Ambalaje in curs de aprovizionare', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('331', 'Produse in curs de executie', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('332', 'Servicii in curs de executie', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('341', 'Semifabricate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('345', 'Produse finite', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('346', 'Produse reziduale', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('347', 'Produse agricole', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('348', 'Diferente de pret la produse', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('351', 'Materii si materiale aflate la terti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('354', 'Produse aflate la terti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('356', 'Active biologice de natura stocurilor aflate la terti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('357', 'Marfuri aflate la terti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('358', 'Ambalaje aflate la terti', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('361', 'Active biologice de natura stocurilor', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('368', 'Diferente de pret la active biologice de natura stocurilor', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('371', 'Marfuri', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('378', 'Diferente de pret la marfuri', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('381', 'Ambalaje', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('388', 'Diferente de pret la ambalaje', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('391', 'Ajustari pentru deprecierea materiilor prime', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('392', 'Ajustari pentru deprecierea materialelor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3921', 'Ajustari pentru deprecierea materialelor consumabile', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3922', 'Ajustari pentru deprecierea materialelor de natura obiectelor de inventar', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('393', 'Ajustari pentru deprecierea productiei in curs de executie', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('394', 'Ajustari pentru deprecierea produselor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3941', 'Ajustari pentru deprecierea semifabricatelor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3945', 'Ajustari pentru deprecierea produselor finite', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3946', 'Ajustari pentru deprecierea produselor reziduale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('3947', 'Ajustari pentru deprecierea produselor agricole', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('395', 'Ajustari pentru deprecierea stocurilor aflate la terti', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('396', 'Ajustari pentru deprecierea activelor biologice de natura stocurilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('397', 'Ajustari pentru deprecierea marfurilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('398', 'Ajustari pentru deprecierea ambalajelor', 'LIABILITY', 'Sintetic', 1);

-- ============================================================
-- CLASA 4 — Conturi de terti
-- ============================================================

-- 40. Furnizori
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('401', 'Furnizori', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('403', 'Efecte de platit', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('404', 'Furnizori de imobilizari', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('405', 'Efecte de platit pentru imobilizari', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('408', 'Furnizori - facturi nesosite', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('409', 'Furnizori - debitori', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4091', 'Furnizori - debitori pentru cumparari de bunuri de natura stocurilor', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4092', 'Furnizori - debitori pentru prestari de servicii', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4093', 'Avansuri acordate pentru imobilizari corporale', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4094', 'Avansuri acordate pentru imobilizari necorporale', 'ASSET', 'Analitic', 1);

-- 41. Clienti
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('411', 'Clienti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4111', 'Clienti', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4118', 'Clienti incerti sau in litigiu', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('413', 'Efecte de primit de la clienti', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('418', 'Clienti - facturi de intocmit', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('419', 'Clienti - creditori', 'LIABILITY', 'Sintetic', 1);

-- 42. Personal
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('421', 'Personal - salarii datorate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('423', 'Personal - ajutoare materiale datorate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('424', 'Prime reprezentand participarea personalului la profit', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('425', 'Avansuri acordate personalului', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('426', 'Drepturi de personal neridicate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('427', 'Retineri din salarii datorate tertilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('428', 'Alte datorii si creante in legatura cu personalul', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4281', 'Alte datorii in legatura cu personalul', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4282', 'Alte creante in legatura cu personalul', 'ASSET', 'Analitic', 1);

-- 43. Asigurari sociale
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('431', 'Asigurari sociale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4311', 'Contributia unitatii la asigurarile sociale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4312', 'Contributia personalului la asigurarile sociale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4313', 'Contributia angajatorului pentru asigurarile sociale de sanatate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4314', 'Contributia angajatilor pentru asigurarile sociale de sanatate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4315', 'Contributia de asigurari sociale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4316', 'Contributia de asigurari sociale de sanatate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('436', 'Contributia asiguratorie pentru munca', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('437', 'Ajutor de somaj', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4371', 'Contributia unitatii la fondul de somaj', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4372', 'Contributia personalului la fondul de somaj', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('438', 'Alte datorii si creante sociale', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4381', 'Alte datorii sociale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4382', 'Alte creante sociale', 'ASSET', 'Analitic', 1);

-- 44. Bugetul statului
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('441', 'Impozitul pe profit si alte impozite', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4411', 'Impozitul pe profit', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4415', 'Impozitul specific unor activitati', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4418', 'Impozitul pe venit', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('442', 'Taxa pe valoarea adaugata', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4423', 'TVA de plata', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4424', 'TVA de recuperat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4426', 'TVA deductibila', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4427', 'TVA colectata', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4428', 'TVA neexigibila', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('444', 'Impozitul pe venituri de natura salariilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('445', 'Subventii', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4451', 'Subventii guvernamentale', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4452', 'Imprumuturi nerambursabile cu caracter de subventii', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4458', 'Alte sume primite cu caracter de subventii', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('446', 'Alte impozite, taxe si varsamente asimilate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('447', 'Fonduri speciale - taxe si varsamente asimilate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('448', 'Alte datorii si creante cu bugetul statului', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4481', 'Alte datorii fata de bugetul statului', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4482', 'Alte creante privind bugetul statului', 'ASSET', 'Analitic', 1);

-- 45. Grup si actionari
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('451', 'Decontari intre entitatile afiliate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4511', 'Decontari intre entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4518', 'Dobanzi aferente decontarilor intre entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('453', 'Decontari cu entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('455', 'Sume datorate actionarilor/asociatilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4551', 'Actionari/Asociati - conturi curente', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4558', 'Actionari/Asociati - dobanzi la conturi curente', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('456', 'Decontari cu actionarii/asociatii privind capitalul', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('457', 'Dividende de plata', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('458', 'Decontari din operatiuni in participatie', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4581', 'Decontari din operatiuni in participatie - pasiv', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4582', 'Decontari din operatiuni in participatie - activ', 'ASSET', 'Analitic', 1);

-- 46. Debitori si creditori diversi
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('461', 'Debitori diversi', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('462', 'Creditori diversi', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('463', 'Creante reprezentand dividende repartizate in cursul exercitiului financiar', 'ASSET', 'Sintetic', 1);

-- 47. Conturi de regularizare
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('471', 'Cheltuieli inregistrate in avans', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('472', 'Venituri inregistrate in avans', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('473', 'Decontari din operatiuni in curs de clarificare', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('475', 'Subventii pentru investitii', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4751', 'Subventii guvernamentale pentru investitii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4752', 'Imprumuturi nerambursabile cu caracter de subventii pentru investitii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4753', 'Donatii pentru investitii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4754', 'Plusuri de inventar de natura imobilizarilor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4758', 'Alte sume primite cu caracter de subventii pentru investitii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('478', 'Venituri in avans aferente activelor primite prin transfer de la clienti', 'LIABILITY', 'Sintetic', 1);

-- 48. Decontari in cadrul unitatii
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('481', 'Decontari intre unitate si subunitati', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('482', 'Decontari intre subunitati', 'LIABILITY', 'Sintetic', 1);

-- 49. Ajustari pentru deprecierea creantelor
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('491', 'Ajustari pentru deprecierea creantelor - clienti', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('495', 'Ajustari pentru deprecierea creantelor - decontari in cadrul grupului si cu actionarii/asociatii', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('496', 'Ajustari pentru deprecierea creantelor - debitori diversi', 'LIABILITY', 'Sintetic', 1);

-- ============================================================
-- CLASA 5 — Conturi de trezorerie
-- ============================================================

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('501', 'Actiuni detinute la entitatile afiliate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('505', 'Obligatiuni emise si rascumparate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('506', 'Obligatiuni', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('507', 'Certificate verzi primite', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('508', 'Alte investitii pe termen scurt si creante asimilate', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5081', 'Alte titluri de plasament', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5088', 'Dobanzi la obligatiuni si titluri de plasament', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('509', 'Varsamente de efectuat pentru investitiile pe termen scurt', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5091', 'Varsamente de efectuat pentru actiunile detinute la entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5092', 'Varsamente de efectuat pentru alte investitii pe termen scurt', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('511', 'Valori de incasat', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5112', 'Cecuri de incasat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5113', 'Efecte de incasat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5114', 'Efecte remise spre scontare', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('512', 'Conturi curente la banci', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5121', 'Conturi la banci in lei', 'ASSET', 'CURRENT_ASSET', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5124', 'Conturi la banci in valuta', 'ASSET', 'CURRENT_ASSET', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5125', 'Sume in curs de decontare', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('518', 'Dobanzi', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5186', 'Dobanzi de platit', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5187', 'Dobanzi de incasat', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('519', 'Credite bancare pe termen scurt', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5191', 'Credite bancare pe termen scurt', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5192', 'Credite bancare pe termen scurt nerambursate la scadenta', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5193', 'Credite externe guvernamentale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5194', 'Credite externe garantate de stat', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5195', 'Credite externe garantate de banci', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5196', 'Credite de la Trezoreria Statului', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5197', 'Credite interne garantate de stat', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5198', 'Dobanzi aferente creditelor bancare pe termen scurt', 'LIABILITY', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('531', 'Casa', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5311', 'Casa in lei', 'ASSET', 'CURRENT_ASSET', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5314', 'Casa in valuta', 'ASSET', 'CURRENT_ASSET', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('532', 'Alte valori', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5321', 'Timbre fiscale si postale', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5322', 'Bilete de tratament si odihna', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5323', 'Tichete si bilete de calatorie', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5328', 'Alte valori', 'ASSET', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('541', 'Acreditive', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5411', 'Acreditive in lei', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('5414', 'Acreditive in valuta', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('542', 'Avansuri de trezorerie', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('581', 'Viramente interne', 'ASSET', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('591', 'Ajustari pentru pierderea de valoare a actiunilor detinute la entitatile afiliate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('595', 'Ajustari pentru pierderea de valoare a obligatiunilor emise si rascumparate', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('596', 'Ajustari pentru pierderea de valoare a obligatiunilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('598', 'Ajustari pentru pierderea de valoare a altor investitii pe termen scurt', 'LIABILITY', 'Sintetic', 1);

-- ============================================================
-- CLASA 6 — Conturi de cheltuieli
-- ============================================================

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('601', 'Cheltuieli cu materiile prime', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('602', 'Cheltuieli cu materialele consumabile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6021', 'Cheltuieli cu materialele auxiliare', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6022', 'Cheltuieli privind combustibilii', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6023', 'Cheltuieli privind materialele pentru ambalat', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6024', 'Cheltuieli privind piesele de schimb', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6025', 'Cheltuieli privind semintele si materialele de plantat', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6026', 'Cheltuieli privind furajele', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6028', 'Cheltuieli privind alte materiale consumabile', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('603', 'Cheltuieli privind materialele de natura obiectelor de inventar', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('604', 'Cheltuieli privind materialele nestocate', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('605', 'Cheltuieli privind utilitatile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6051', 'Cheltuieli privind consumul de energie', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6052', 'Cheltuieli privind consumul de apa', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6053', 'Cheltuieli privind consumul de gaze naturale', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6058', 'Cheltuieli cu alte utilitati', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('606', 'Cheltuieli privind activele biologice de natura stocurilor', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('607', 'Cheltuieli privind marfurile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('608', 'Cheltuieli privind ambalajele', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('609', 'Reduceri comerciale primite', 'REVENUE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('611', 'Cheltuieli cu intretinerea si reparatiile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('612', 'Cheltuieli cu redeventele, locatiile de gestiune si chiriile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6121', 'Cheltuieli cu redeventele', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6122', 'Cheltuieli cu locatiile de gestiune', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6123', 'Cheltuieli cu chiriile', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('613', 'Cheltuieli cu primele de asigurare', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('614', 'Cheltuieli cu studiile si cercetarile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('615', 'Cheltuieli cu pregatirea personalului', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('616', 'Cheltuieli aferente drepturilor de proprietate intelectuala', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('617', 'Cheltuieli de management', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('618', 'Cheltuieli de consultanta', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('621', 'Cheltuieli cu colaboratorii', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('622', 'Cheltuieli privind comisioanele si onorariile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('623', 'Cheltuieli de protocol, reclama si publicitate', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6231', 'Cheltuieli de protocol', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6232', 'Cheltuieli de reclama si publicitate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('624', 'Cheltuieli cu transportul de bunuri si personal', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('625', 'Cheltuieli cu deplasari, detasari si transferari', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('626', 'Cheltuieli postale si taxe de telecomunicatii', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('627', 'Cheltuieli cu serviciile bancare si asimilate', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('628', 'Alte cheltuieli cu serviciile executate de terti', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('635', 'Cheltuieli cu alte impozite, taxe si varsamente asimilate', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('641', 'Cheltuieli cu salariile personalului', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('642', 'Cheltuieli cu avantajele in natura si tichetele acordate salariatilor', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6421', 'Cheltuieli cu avantajele in natura acordate salariatilor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6422', 'Cheltuieli cu tichetele acordate salariatilor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('643', 'Cheltuieli cu remunerarea in instrumente de capitaluri proprii', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('644', 'Cheltuieli cu primele reprezentand participarea personalului la profit', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('645', 'Cheltuieli privind asigurarile si protectia sociala', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6451', 'Cheltuieli privind contributia unitatii la asigurarile sociale', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6452', 'Cheltuieli privind contributia unitatii pentru ajutorul de somaj', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6453', 'Cheltuieli privind contributia angajatorului pentru asigurarile sociale de sanatate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6455', 'Cheltuieli privind contributia unitatii la asigurarile de viata', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6456', 'Cheltuieli privind contributia unitatii la fondurile de pensii facultative', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6457', 'Cheltuieli privind contributia unitatii la primele de asigurare voluntara de sanatate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6458', 'Alte cheltuieli privind asigurarile si protectia sociala', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('646', 'Cheltuieli privind contributia asiguratorie pentru munca', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('652', 'Cheltuieli cu protectia mediului inconjurator', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('654', 'Pierderi din creante si debitori diversi', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('655', 'Cheltuieli din reevaluarea imobilizarilor corporale', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('658', 'Alte cheltuieli de exploatare', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6581', 'Despagubiri, amenzi si penalitati', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6582', 'Donatii acordate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6583', 'Cheltuieli privind activele cedate si alte operatiuni de capital', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6584', 'Cheltuieli cu sumele sau bunurile acordate ca sponsorizari', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6587', 'Cheltuieli privind calamitatile si alte evenimente similare', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6588', 'Alte cheltuieli de exploatare', 'EXPENSE', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('663', 'Pierderi din creante legate de participatii', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('664', 'Cheltuieli privind investitiile financiare cedate', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6641', 'Cheltuieli privind imobilizarile financiare cedate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6642', 'Pierderi din investitiile pe termen scurt cedate', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('665', 'Cheltuieli din diferente de curs valutar', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('666', 'Cheltuieli privind dobanzile', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('667', 'Cheltuieli privind sconturile acordate', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('668', 'Alte cheltuieli financiare', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('681', 'Cheltuieli de exploatare privind amortizarile, provizioanele si ajustarile pentru depreciere', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6811', 'Cheltuieli de exploatare privind amortizarea imobilizarilor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6812', 'Cheltuieli de exploatare privind provizioanele', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6813', 'Cheltuieli de exploatare privind ajustarile pentru deprecierea imobilizarilor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6814', 'Cheltuieli de exploatare privind ajustarile pentru deprecierea activelor circulante', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6817', 'Cheltuieli de exploatare privind ajustarile pentru deprecierea fondului comercial', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('686', 'Cheltuieli financiare privind amortizarile, provizioanele si ajustarile pentru pierdere de valoare', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6861', 'Cheltuieli privind actualizarea provizioanelor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6863', 'Cheltuieli financiare privind ajustarile pentru pierderea de valoare a imobilizarilor financiare', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6864', 'Cheltuieli financiare privind ajustarile pentru pierderea de valoare a activelor circulante', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6868', 'Cheltuieli financiare privind amortizarea primelor de rambursare a obligatiunilor si a altor datorii', 'EXPENSE', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('691', 'Cheltuieli cu impozitul pe profit', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('694', 'Cheltuieli cu impozitul pe profit rezultat din decontarile in cadrul grupului fiscal', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('695', 'Cheltuieli cu impozitul specific unor activitati', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('698', 'Cheltuieli cu impozitul pe venit si cu alte impozite', 'EXPENSE', 'Sintetic', 1);

-- ============================================================
-- CLASA 7 — Conturi de venituri
-- ============================================================

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('701', 'Venituri din vanzarea produselor finite, produselor agricole si a activelor biologice de natura stocurilor', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7015', 'Venituri din vanzarea produselor finite', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7017', 'Venituri din vanzarea produselor agricole', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7018', 'Venituri din vanzarea activelor biologice de natura stocurilor', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('702', 'Venituri din vanzarea semifabricatelor', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('703', 'Venituri din vanzarea produselor reziduale', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('704', 'Venituri din servicii prestate', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('705', 'Venituri din studii si cercetari', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('706', 'Venituri din redevente, locatii de gestiune si chirii', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('707', 'Venituri din vanzarea marfurilor', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('708', 'Venituri din activitati diverse', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('709', 'Reduceri comerciale acordate', 'EXPENSE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('711', 'Venituri aferente costurilor stocurilor de produse', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('712', 'Venituri aferente costurilor serviciilor in curs de executie', 'REVENUE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('721', 'Venituri din productia de imobilizari necorporale', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('722', 'Venituri din productia de imobilizari corporale', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('725', 'Venituri din productia de investitii imobiliare', 'REVENUE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('741', 'Venituri din subventii de exploatare', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7411', 'Venituri din subventii de exploatare aferente cifrei de afaceri', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7412', 'Venituri din subventii de exploatare pentru materii prime si materiale', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7413', 'Venituri din subventii de exploatare pentru alte cheltuieli externe', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7414', 'Venituri din subventii de exploatare pentru plata personalului', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7416', 'Venituri din subventii de exploatare pentru alte cheltuieli de exploatare', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7418', 'Venituri din subventii de exploatare pentru dobanda datorata', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7419', 'Venituri din subventii de exploatare aferente altor venituri', 'REVENUE', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('754', 'Venituri din creante reactivate si debitori diversi', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('755', 'Venituri din reevaluarea imobilizarilor corporale', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('758', 'Alte venituri din exploatare', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7581', 'Venituri din despagubiri, amenzi si penalitati', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7582', 'Venituri din donatii primite', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7583', 'Venituri din vanzarea activelor si alte operatiuni de capital', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7584', 'Venituri din subventii pentru investitii', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7588', 'Alte venituri din exploatare', 'REVENUE', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('761', 'Venituri din imobilizari financiare', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7611', 'Venituri din actiuni detinute la entitatile afiliate', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7612', 'Venituri din actiuni detinute la entitati asociate', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7613', 'Venituri din actiuni detinute la entitati controlate in comun', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7615', 'Venituri din alte imobilizari financiare', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('762', 'Venituri din investitii financiare pe termen scurt', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('764', 'Venituri din investitii financiare cedate', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7641', 'Venituri din imobilizari financiare cedate', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7642', 'Castiguri din investitii pe termen scurt cedate', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('765', 'Venituri din diferente de curs valutar', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('766', 'Venituri din dobanzi', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('767', 'Venituri din sconturi obtinute', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('768', 'Alte venituri financiare', 'REVENUE', 'Sintetic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('781', 'Venituri din provizioane si ajustari pentru depreciere privind activitatea de exploatare', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7812', 'Venituri din provizioane', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7813', 'Venituri din ajustari pentru deprecierea imobilizarilor', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7814', 'Venituri din ajustari pentru deprecierea activelor circulante', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7815', 'Venituri din fondul comercial negativ', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('786', 'Venituri financiare din amortizari si ajustari pentru pierdere de valoare', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7863', 'Venituri financiare din ajustari pentru pierderea de valoare a imobilizarilor financiare', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7864', 'Venituri financiare din ajustari pentru pierderea de valoare a activelor circulante', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7865', 'Venituri financiare din amortizarea diferentelor aferente titlurilor de stat', 'REVENUE', 'Analitic', 1);

INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('794', 'Venituri din impozitul pe profit rezultat din decontarile in cadrul grupului fiscal in domeniul impozitului pe profit', 'REVENUE', 'Sintetic', 1);