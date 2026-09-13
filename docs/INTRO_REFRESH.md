# Intro aggiornata

La schermata iniziale usa uno sfondo privo di logo e pulsante incorporati. Il logo originale e il pulsante HTML sono disposti nello stesso contenitore, al centro della scena. Il layout gestisce finestre desktop, portrait e landscape, con animazione disattivabile tramite prefers-reduced-motion.

File: `css/title-intro.css`, `index.html`, `css/v104-professional-layout.css`.
Sfondo: `assets/screens/01_title_background.png`. L'immagine originale è conservata.

Start funziona con clic, tocco nativo del pulsante, Invio e Spazio. Rimossi i listener duplicati; l'avvio è idempotente e trasferisce il focus alla modalità carriera.

Verifica in Chrome: intro renderizzata nella finestra desktop; passaggio al menu principale da tastiera con focus sulla carriera; anteprime in iframe a 390 × 844 e 844 × 390, senza sovrapposizioni fra logo e pulsante. Queste anteprime verificano il layout, non emulano un dispositivo fisico.

## Generazione dello sfondo

Tool integrato image_gen (skill imagegen); edit target `assets/screens/01_title_screen.png`.

Prompt finale:

> Edit target: supplied game title stadium artwork. precise-object-edit. Create a clean background plate for a responsive football videogame title screen. Remove the entire large floating SerieA 9000 SIM logo from sky and reconstruct natural sunset sky and distant stadium behind it. Remove the small PREMI START lettering and ornaments from pitch, reconstruct grass. Preserve cinematic Italian 1990s nostalgic stadium sunset, trophy and worn ball and scarf at lower left, tactical board and books lower right, stadium crowd and tricolour flags and floodlights. Extend to full bleed 16:9 landscape, no black frame or rounded corners. Keep foreground props toward outer lower corners, center broad and calm for separately rendered HTML game logo and button. No new lettering, no UI, no buttons, no central logo. High quality detailed warm gold and deep navy game key art.
