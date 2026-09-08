SERIEA 9000 SIM — V7.2 PUBLICATION UI
=======================================

Build completa per GitHub Pages.

OBIETTIVO V7.2
- Portare nel gioco i layout approvati per: ingaggio manager, selezione squadra e dashboard stagione.
- Massima leggibilità su sfondi fotografici senza tornare ai grandi pannelli bianchi.
- Correggere gli sprite italiani delle divise, incluso il fondo bianco tra le gambe.
- Conservare logica partita, salvataggi multipli, eventi visuali e cambi CPU della V7.1.

MODIFICHE PRINCIPALI
1. INGAGGIO MANAGER
   - corpo narrativo riscritto e reso molto più grande/leggibile;
   - font UI e testo separati: titoli compatti, corpo Verdana/Geneva;
   - contrasto navy/avorio e gerarchia visiva più netta.

2. SCELTA SQUADRA
   - layout 3 colonne stabile;
   - pannello sinistro: Città, Stadio, Vice, motto;
   - pannello destro: Overall e moduli;
   - pannelli navy ad alta leggibilità con bordo oro;
   - stemma e controlli centrati.

3. DASHBOARD STAGIONE
   - Riepilogo e Stato in due pannelli superiori leggibili;
   - navigazione spostata su una riga dedicata;
   - Prossima partita con stemmi, nomi, data, giornata e CTA centrale;
   - tabelle/altre viste con contrasto forzato.

4. DIVISE
   - 32 HOME + 32 AWAY italiane ripulite;
   - rimosso il grande fondo bianco chiuso tra le gambe senza eliminare le parti bianche della divisa;
   - canvas e centratura simmetrici preservati.

5. RESPONSIVE
   - desktop senza scroll della pagina nelle schermate principali;
   - regole dedicate alle finestre desktop basse;
   - fallback mobile a pannelli impilati e leggibili.

CONTROLLI ESEGUITI
- 113 ID HTML, nessun duplicato.
- Nessun riferimento locale CSS/JS/IMG mancante.
- Tutti i file JS esterni passano node --check.
- Tutti gli script inline passano node --check.
- 32 stemmi italiani presenti.
- 32 kit HOME + 32 kit AWAY italiani presenti e con trasparenza.
- 6 asset evento presenti: goal, foul, offside, yellow, red, substitution.
- Test automatico browser headless non disponibile nell'ambiente di build: Chromium locale è bloccato/instabile; la verifica automatica effettuata è quindi statica e sugli asset.

UPLOAD GITHUB
Estrarre lo ZIP e caricare TUTTO il contenuto direttamente nella root del repository SOCCERSIM9000, sovrascrivendo i file esistenti. index.html deve rimanere nella root.

Credito fisso:
Sviluppato ed ideato da b3pZ
