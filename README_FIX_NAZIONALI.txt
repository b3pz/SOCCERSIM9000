SERIEA 9000 SIM — V10 FINAL RC1 — FIX NAZIONALI PNG

Correzione: il codice V10 puntava ancora ai vecchi asset .svg delle nazionali.
Ora stemmi e kit HOME/AWAY puntano ai nuovi file .png caricati nel repository.

File da copiare nella root del repository mantenendo le cartelle:
- index.html
- js/v10-release.js

L'index usa ?v=1031 per forzare il browser a caricare il JS aggiornato.
