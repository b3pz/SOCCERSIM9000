SERIEA 9000 SIM — GITHUB SYNC DA MASTER LOCALE

BASE:
- GitHub attuale: githubattuale.zip
- Master locale: SOCCERSIM9000-main(5).zip

OBIETTIVO:
Integrare su GitHub le parti presenti nel master locale ma assenti/diverse online,
senza cancellare le modifiche grafiche già presenti su GitHub (nuovo sfondo Coppe,
icona Modalità Coppe e relativo index.html).

COME INSTALLARE:
1. Apri questa ZIP.
2. Entra in SOCCERSIM9000-main.
3. Copia il contenuto nella ROOT del repository GitHub mantenendo le cartelle.
4. Sostituisci i file omonimi quando richiesto.
5. Non cancellare gli altri file del repository.

QUESTA PATCH RIPRISTINA/ALLINEA:
- sfondo e presentazione Carriera (heritage)
- career-refresh.css, che l'index già richiede ma su GitHub mancava
- sfondi/asset del layout Carriera
- campo tattico SVG
- match-coherence più completo (identità squadre/leggibilità sul campo)
- stato attivo delle viste stagione in v10-release.js
- versione locale dei final touches v91

QUESTA PATCH NON TOCCA:
- index.html attuale di GitHub
- nuovo sfondo Modalità Coppe
- nuova icona Modalità Coppe
- gameplay/database/roster non coinvolti da questi file

NOTA:
Le modifiche all'intro e allo spostamento del logo SerieA 9000 SIM restano da fare
come passaggio successivo, dopo aver riallineato GitHub al master locale.
