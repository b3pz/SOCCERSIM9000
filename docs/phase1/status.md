# SerieA 9000 SIM — stato grafica e presentazione

Aggiornamento: 14 settembre 2026.

## Interfaccia e navigazione

- Il centro stagione resta leggero e apre Risultati, Gironi, Calendario, Coppe,
  Marcatori e Assist in pagine dedicate con ritorno esplicito.
- Il calendario usa un foglio mensile ispirato al riferimento cartaceo: griglia
  lunedì-domenica, stemmi degli avversari, casa/trasferta, coppe e mese navigabile.
- Le scelte arbitrarie da 5, 10 e 15 minuti sono state eliminate. Rimane la sola
  scelta di presentazione della gara: partita 3D completa o azioni salienti.
- La cerimonia del trofeo è una cinematica a schermo intero con ingresso,
  premiazione, sollevamento della coppa, folla, luci e uscita controllata.
- Gli stadi 3D hanno geometrie, spalti, curve, torri, luci e colori diversi in base
  allo stadio selezionato, compresi San Siro e Artemio Franchi.
- Il layout è adattato a telefono verticale e orizzontale. La prova Safari a
  390 × 844 e 844 × 390 non rileva elementi oltre il bordo.

## Stemmi e kit

- Copertura completa: 32 club italiani, 32 club esteri e 61 edizioni nazionali.
- Tutti i 375 PNG richiesti sono RGBA con trasparenza reale.
- Rimossi i fondi neri incorporati da 32 stemmi e 64 kit esteri.
- Ricostruiti 22 kit nazionali incompleti con figura intera, scarpe, base e
  targhette CASA/TRASFERTA in italiano.
- Create trasferte distinte per Chievo 2001/02 e Reggina 2002/03, prima duplicate
  delle rispettive maglie di casa.
- Completati 57 stemmi nazionali con bandiera, medaglione federale, sigla, stelle,
  anno e trama tessile; conservati i quattro stemmi dettagliati già validi.
- Le coordinate torace dei kit ricostruiti sono sovrascritte in
  `js/asset-quality.js` per mantenere corrette le texture sui modelli 3D.

## Verifiche

```text
PASS: 5276 checks; 2164 players; 32 Italian + 32 foreign + 61 national editions; 100 completed tournaments.
PASS: 375 PNG verificati; 125 edizioni; stemmi + kit casa/trasferta completi, RGBA e senza coppie duplicate.
```

Sono stati controllati anche la sintassi JavaScript/Python, i riferimenti locali
di `index.html`, gli ID statici duplicati e le schermate Calendario, Scelta divise
e Cinematica in Safari. Resta consigliata una prova finale su iPhone e Android
fisici prima della pubblicazione.
