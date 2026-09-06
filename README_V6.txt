SERIEA 9000 SIM — V6 FOUNDATION
Sviluppato ed ideato da b3pZ

CONTENUTO
- Gioco V5.1/V5.2 preservato come base funzionante.
- 64 team-season congelati: 32 italiane + 32 straniere.
- Stemmi individuali per 64 team-season.
- Maglie italiane HOME/AWAY individuali.
- Maglie straniere HOME/AWAY ricavate dalle tavole fornite.
- 1.536 record giocatore PLACEHOLDER (24 per squadra) con schema attributi definitivo.
- IndexedDB: carriere multiple, nessuna sovrascrittura involontaria, 3 backup automatici.
- Export/import .s9save.
- SQL Supabase pronto con RLS.
- 10 schermate grafiche conservate.

IMPORTANTE
Le rose storiche reali NON sono ancora compilate: i file players/*.json sono placeholder intenzionali.
Supabase NON e' attivo finche' non si crea il progetto e non si inseriscono URL/anon key.

GITHUB
Caricare TUTTO il contenuto di questa cartella nella root del repository SOCCERSIM9000.

SUPABASE
1. Creare un progetto.
2. SQL Editor > New query.
3. Incollare sql/supabase_setup.sql e Run.
4. In Authentication abilitare Email/Password.
5. Copiare Project URL e anon key solo quando collegheremo il cloud-save.
NON inserire mai la service_role key nel repository.
