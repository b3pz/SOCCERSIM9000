CALCIO RETRO V2

Nuovo flusso manageriale:
1. Creazione manager
2. Scelta squadra
3. Allenatore storico citato come vice
4. Riepilogo stagione
5. Pre-partita con modulo, atteggiamento, formazione e battitori
6. Primo tempo
7. Intervallo
8. Secondo tempo
9. Analisi post-partita
10. Ritorno al riepilogo stagione

Riepilogo stagione:
- Prossima partita
- Risultati
- Classifica
- Marcatori
- Assist

Partita:
- pausa
- 1x / 2x / 4x
- tattica e cambi
- massimo 3 sostituzioni
- animazioni occasioni, gol e cartellini
- intervallo manuale

DATABASE:
database.json ancora locale.
supabase_schema.sql della V1 resta la base prevista per la migrazione a Supabase.


V2.1 CAMPO:
- prato a fasce
- linea di metà campo
- cerchio e dischetto centrale
- aree di rigore
- aree piccole
- dischetti del rigore
- archi delle aree
- corner
- porte esterne con rete visibile
- palla che entra fisicamente nella porta durante il gol

V2.2
- Palla sincronizzata con i pallini: conduzione, passaggi, assist e tiro.
- Un gol viene registrato solo dopo che la palla attraversa la porta.
- Parata, palo e tiro fuori hanno traiettorie coerenti con la cronaca.
- Marcatori e assist mostrano solo giocatori con valori > 0.
- Cambi ridisegnati con tabelle TITOLARI / RISERVE.
- Tabelle cambi mostrano ruolo generale, posizione, OVR, morale, velocità, tecnica e passaggio.
- Selezione cambio cliccando una riga titolare e una riga riserva.
- Panchina costruita con vincolo POR / DIF / CEN / ATT; aggiunto portiere di riserva tecnico se la rosa prototipale ne è priva.

V2.3 - PRESENTAZIONE ANNI 90
- Nuova identità "Serie A '90 SIM"
- Font/UI più vicini ai manager PC anni 90
- Schermata iniziale centrale per nome manager
- Seconda schermata dedicata alla scelta squadra
- Selettore squadra con frecce destra/sinistra
- Grande emblema provvisorio basato sui colori sociali
- Città, stadio, vice e slogan sulla sinistra
- Overall e moduli sulla destra
- Modifica titolari/riserve disponibile anche nel pre-partita senza consumare cambi
- Sintesi audio generata dal browser: ambiente stadio, aumento pubblico al gol, fischio arbitrale
- Evento fallo: fischio, gioco fermo e pausa prima della ripresa

V2.4 - SCHEDA GIOCATORE / PIAZZATI
- Clic sui giocatori in formazione e nelle tabelle cambi.
- Scheda giocatore dedicata.
- Nuovo attributo CROSS 1-100.
- CROSS evidenziato per i calci d'angolo.
- TIRO evidenziato per i rigori.
- TIRO evidenziato per i calci di punizione.
- Tecnica mostrata come riferimento aggiuntivo.
- Il valore CROSS è per ora derivato da passaggio/tecnica/visione e potrà essere verificato storicamente squadra per squadra.

V2.5 - MATCH EXPERIENCE / TITLE SCREEN
- Nuova title screen con logo Serie A '90 SIM e PRESS START lampeggiante.
- Introduzione manager più narrativa e accogliente in stile anni 90.
- Cronaca partita ridisegnata: ultima azione grande e leggibile al centro/sinistra.
- Quando arriva una nuova frase, la precedente passa nello storico sulla destra.
- Colore laterale diverso per squadra di casa e trasferta.
- Campo nascosto durante le fasi normali.
- Campo mostrato solo per occasioni, falli, cartellini e gol.
- Dopo l'evento importante il campo sparisce e si torna alla cronaca testuale.
- Font della cronaca aumentato.
- Elementi grafici aggiuntivi tipo RADIO PARTITA / DIRETTA STADIO / 90 MINUTI.

V2.6 MOBILE FIX
- Corretto PRESS START con binding DOMContentLoaded e supporto click/touch/keyboard.
- Aggiunto viewport mobile.
- Touch target minimi 44px.
- Layout squadra ridisegnato per schermi piccoli.
- Tabelle scrollabili orizzontalmente.
- Modali scrollabili e adattive.
- Campo responsive.
- Cronaca e storico impilati su mobile.
- Input a 16px per evitare zoom automatico su iPhone.
- Migliorata compatibilità touch su frecce e pulsanti.
