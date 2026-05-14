-- V10: Conturi lipsa din V9 — OMFP 1802/2014

SET NOCOUNT ON;

-- Clasa 2
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('264', 'Titluri puse in echivalenta', 'ASSET', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2674', 'Dobanda aferenta creantelor fata de entitatile asociate si entitatile controlate in comun', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2693', 'Varsamente de efectuat privind actiunile detinute la entitati controlate in comun', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2964', 'Ajustari pentru pierderea de valoare a sumelor de incasat de la entitatile afiliate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('2965', 'Ajustari pentru pierderea de valoare a creantelor fata de entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Analitic', 1);

-- Clasa 4
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4318', 'Alte contributii pentru asigurarile sociale de sanatate', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4417', 'Impozitul pe profit la nivelul impozitului minim pe cifra de afaceri', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4531', 'Decontari cu entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4538', 'Dobanzi aferente decontarilor cu entitatile asociate si entitatile controlate in comun', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('466', 'Decontari din operatiuni de fiducie', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4661', 'Datorii din operatiuni de fiducie', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4662', 'Creante din operatiuni de fiducie', 'ASSET', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('467', 'Datorii aferente distribuirilor interimare de dividende', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('490', 'Ajustari pentru deprecierea creantelor reprezentand avansuri acordate furnizorilor', 'LIABILITY', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4901', 'Ajustari pentru deprecierea creantelor aferente cumpararilor de bunuri de natura stocurilor', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4902', 'Ajustari pentru deprecierea creantelor aferente prestarilor de servicii', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4903', 'Ajustari pentru deprecierea creantelor aferente imobilizarilor corporale', 'LIABILITY', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('4904', 'Ajustari pentru deprecierea creantelor aferente imobilizarilor necorporale', 'LIABILITY', 'Analitic', 1);

-- Clasa 6
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6351', 'Cheltuieli cu impozitul suplimentar pentru sectoarele de activitate specifice', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6461', 'Cheltuieli privind contributia asiguratorie pentru munca corespunzatoare salariatilor', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6462', 'Cheltuieli privind contributia asiguratorie pentru munca corespunzatoare altor persoane decat salariatii', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('651', 'Cheltuieli din operatiuni de fiducie', 'EXPENSE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6511', 'Cheltuieli ocazionate de constituirea fiduciei', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6512', 'Cheltuieli din derularea operatiunilor de fiducie', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6513', 'Cheltuieli din lichidarea operatiunilor de fiducie', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6586', 'Cheltuieli reprezentand transferuri si contributii datorate in baza unor acte normative speciale', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6652', 'Diferente nefavorabile de curs valutar din evaluarea elementelor monetare care fac parte din investitia neta intr-o entitate straina', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('6865', 'Cheltuieli financiare privind amortizarea diferentelor aferente titlurilor de stat', 'EXPENSE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('697', 'Cheltuieli cu impozitul pe profit la nivelul impozitului minim pe cifra de afaceri', 'EXPENSE', 'Sintetic', 1);

-- Clasa 7
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7415', 'Venituri din subventii de exploatare pentru asigurari si protectie sociala', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7417', 'Venituri din subventii de exploatare in caz de calamitati si alte evenimente similare', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('751', 'Venituri din operatiuni de fiducie', 'REVENUE', 'Sintetic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7511', 'Venituri ocazionate de constituirea fiduciei', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7512', 'Venituri din derularea operatiunilor de fiducie', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7513', 'Venituri din lichidarea operatiunilor de fiducie', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7586', 'Venituri reprezentand transferuri cuvenite in baza unor acte normative speciale', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7651', 'Diferente favorabile de curs valutar legate de elementele monetare exprimate in valuta', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7652', 'Diferente favorabile de curs valutar din evaluarea elementelor monetare care fac parte din investitia neta intr-o entitate straina', 'REVENUE', 'Analitic', 1);
INSERT INTO accounts (code, name, type, sub_type, is_active) VALUES ('7818', 'Venituri din ajustari pentru deprecierea creantelor reprezentand avansuri acordate furnizorilor', 'REVENUE', 'Analitic', 1);