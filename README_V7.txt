SERIEA 9000 SIM — V7 RELEASE CANDIDATE
Sviluppato ed ideato da b3pZ

BUILD COMPLETO PER GITHUB PAGES
Caricare il contenuto di questa cartella mantenendo la struttura.

PASS V7
- Intro ridotta da 5s a 2s.
- Layout desktop bloccato nel viewport: le schermate principali non devono richiedere lo scroll della pagina.
- Modalità compatta automatica per finestre desktop basse.
- Font e interlinea manager/introduction rifatti per massima leggibilità.
- Selezione squadra a 3 colonne simmetriche, info sinistra/destra centrate e Overall evidenziato.
- Pannelli visivi alleggeriti: niente grandi box bianchi/crema; overlay trasparenti e gradienti di leggibilità.
- Pre-partita organizzato intorno al campo orizzontale; XI al centro, controlli ai lati.
- Scelta divise ricentrata sui due tunnel con slot identici.
- Rimozione runtime dello sfondo chiaro degli sprite divisa tramite flood-fill connesso ai bordi (preserva le parti bianche interne della maglia).
- Match ridimensionato per occupare lo spazio utile senza scorrimento pagina.
- Eventi visuali dedicati: gol, fallo, fuorigioco, ammonizione, espulsione, sostituzione.
- Fuorigioco aggiunto alla generazione eventi partita.
- La CPU avversaria effettua 1–3 sostituzioni reali nel secondo tempo e aggiorna la propria formazione.
- Halftime e post-match ripuliti per contrasto e leggibilità.
- Touch/responsive preservati.
- Sistema salvataggi multipli/backup preservato.

ASSET EVENTI
assets/events/goal.png
assets/events/offside.png
assets/events/foul.png
assets/events/yellow.png
assets/events/red.png
assets/events/substitution.png

QA STATICO ESEGUITO
- JavaScript V7: syntax check Node OK.
- Nessun ID HTML duplicato.
- Tutti i riferimenti statici CSS/JS/IMG presenti nel pacchetto.
- 10 schermate principali trovate nel DOM.
- 42 pulsanti / 1 input / 3 select presenti e struttura DOM parsabile.

NOTA DATABASE
La V7 mantiene il database storico separato dal layout. Inter 1997/98 contiene già la rosa estesa reale con rating provvisori; le altre team-season non vanno considerate storicamente definitive finché non vengono verificate una per una. Questa nota è intenzionale: non vengono inventate rose definitive per riempire il database.
